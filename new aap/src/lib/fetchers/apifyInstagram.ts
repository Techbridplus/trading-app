import { ApifyClient } from "apify-client";
import type { Comment } from "@/types";
import { toComment } from "./types";
import { withTimeout } from "@/lib/withTimeout";

/** apify/instagram-post-scraper — returns post + latestComments */
const INSTAGRAM_POST_SCRAPER = "nH2AHrwxeTRJoN5hX";

/** apify/instagram-comment-scraper — returns ALL comments on a post */
const INSTAGRAM_COMMENT_SCRAPER = "SbK00X0JYCPblD2wp";

const APIFY_TIMEOUT_MS = 90_000;

function getClient(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN is not set in .env.local");
  }
  return new ApifyClient({ token });
}

async function runActor(actorId: string, input: Record<string, unknown>) {
  const client = getClient();
  const run = await client.actor(actorId).call(input, { waitSecs: 120 });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items as Record<string, unknown>[];
}

interface IgCommentRaw {
  id?: string;
  text?: string;
  ownerUsername?: string;
  ownerProfilePicUrl?: string;
  owner?: { username?: string; profile_pic_url?: string; full_name?: string };
  timestamp?: string;
  likesCount?: number;
  replies?: IgCommentRaw[];
}

function mapIgComment(raw: IgCommentRaw, index: number): Comment {
  const username =
    raw.ownerUsername ?? raw.owner?.username ?? "unknown";
  return toComment(
    {
      id: raw.id,
      username,
      displayName: raw.owner?.full_name,
      profilePicture: raw.ownerProfilePicUrl ?? raw.owner?.profile_pic_url,
      text: raw.text ?? "",
      likes: raw.likesCount,
      timestamp: raw.timestamp,
    },
    index
  );
}

function flattenComments(rawComments: IgCommentRaw[]): Comment[] {
  const out: Comment[] = [];
  let i = 0;

  for (const raw of rawComments) {
    out.push(mapIgComment(raw, i++));
    for (const reply of raw.replies ?? []) {
      out.push(mapIgComment(reply, i++));
    }
  }

  return out;
}

function mapCommentScraperItems(items: Record<string, unknown>[]): Comment[] {
  return items.map((item, i) =>
    toComment(
      {
        id: item.id ? String(item.id) : undefined,
        username: String(item.ownerUsername ?? item.username ?? "unknown"),
        displayName: item.ownerFullName ? String(item.ownerFullName) : undefined,
        profilePicture: item.ownerProfilePicUrl ? String(item.ownerProfilePicUrl) : undefined,
        text: String(item.text ?? ""),
        likes: typeof item.likesCount === "number" ? item.likesCount : undefined,
        timestamp: item.timestamp ? String(item.timestamp) : undefined,
      },
      i
    )
  );
}

function extractFromPostScraperItems(
  items: Record<string, unknown>[],
  postUrl: string
): { comments: Comment[]; postTitle: string } {
  const shortcode = postUrl.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)?.[1];
  const post =
    items.find((item) => {
      const url = String(item.url ?? "");
      return shortcode ? url.includes(shortcode) : url === postUrl;
    }) ?? items[0];

  if (!post) {
    return { comments: [], postTitle: "" };
  }

  const postTitle = String(post.caption ?? post.text ?? post.alt ?? "Instagram post").slice(0, 200);
  const latestComments = (post.latestComments as IgCommentRaw[] | undefined) ?? [];

  return {
    comments: flattenComments(latestComments),
    postTitle,
  };
}

/** Fetch ALL comments via Apify Instagram Comment Scraper */
async function fetchAllComments(postUrl: string, resultsLimit: number): Promise<Comment[]> {
  const items = await runActor(INSTAGRAM_COMMENT_SCRAPER, {
    directUrls: [postUrl],
    resultsLimit,
  });
  return mapCommentScraperItems(items);
}

/** Fetch post + latest comments via Apify Instagram Post Scraper (your actor) */
async function fetchPostWithComments(
  postUrl: string,
  resultsLimit: number
): Promise<{ comments: Comment[]; postTitle: string }> {
  const items = await runActor(INSTAGRAM_POST_SCRAPER, {
    username: [postUrl],
    resultsLimit: Math.min(resultsLimit, 50),
    skipPinnedPosts: false,
  });
  return extractFromPostScraperItems(items, postUrl);
}

export async function fetchInstagramViaApify(
  postUrl: string,
  resultsLimit = 500
): Promise<{ comments: Comment[]; postTitle: string; source: string }> {
  const run = async () => {
    // 1. Full comment scraper (best for giveaways)
    try {
      const allComments = await fetchAllComments(postUrl, resultsLimit);
      if (allComments.length > 0) {
        return {
          comments: allComments,
          postTitle: `Instagram post`,
          source: "instagram-comment-scraper",
        };
      }
    } catch {
      /* try post scraper */
    }

    // 2. Post scraper — your ApifyClient example (latest comments + caption)
    const { comments, postTitle } = await fetchPostWithComments(postUrl, resultsLimit);
    if (comments.length > 0) {
      return {
        comments,
        postTitle,
        source: "instagram-post-scraper",
      };
    }

    throw new Error(
      "Apify returned 0 comments. The post may be private or have comments disabled."
    );
  };

  return withTimeout(run(), APIFY_TIMEOUT_MS, "Apify fetch timed out after 90 seconds");
}
