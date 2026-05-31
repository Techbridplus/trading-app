import type { Comment } from "@/types";
import { toComment, type FetchResult } from "./types";
import { isBrowserScraperEnabled, scrapeInstagramWithDiagnostics } from "./browser";
import { fetchInstagramViaApify } from "./apifyInstagram";

async function fetchQuickGraphql(shortcode: string): Promise<Comment[]> {
  const params = new URLSearchParams({
    query_id: "17852405266163336",
    variables: JSON.stringify({ shortcode, first: 50 }),
  });

  const res = await fetch(
    `https://www.instagram.com/graphql/query/?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0",
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `https://www.instagram.com/p/${shortcode}/`,
      },
      signal: AbortSignal.timeout(6_000),
    }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as Record<string, unknown>;
  if ((data as { status?: string }).status === "fail") return [];

  const root = data.data as Record<string, unknown> | undefined;
  const media =
    (root?.shortcode_media as Record<string, unknown>) ??
    (root?.xdt_shortcode_media as Record<string, unknown>);
  if (!media) return [];

  const block =
    (media.edge_media_to_parent_comment as { edges?: unknown[] }) ??
    (media.edge_media_to_comment as { edges?: unknown[] });
  const edges = block?.edges ?? [];

  return edges.map((edge, i) => {
    const node = ((edge as { node?: Record<string, unknown> }).node ?? edge) as Record<string, unknown>;
    const owner = node.owner as Record<string, string> | undefined;
    return toComment(
      {
        username: owner?.username ?? "unknown",
        displayName: owner?.full_name,
        profilePicture: owner?.profile_pic_url,
        text: String(node.text ?? ""),
      },
      i
    );
  });
}

export async function fetchInstagramComments(shortcode: string, postUrl: string): Promise<FetchResult> {
  let lastError = "";

  // 1. Apify (primary when token is set)
  if (process.env.APIFY_TOKEN) {
    try {
      const apify = await fetchInstagramViaApify(postUrl, 500);
      return {
        comments: apify.comments,
        postTitle: apify.postTitle || `Instagram post ${shortcode}`,
        platform: "instagram",
        totalFetched: apify.comments.length,
        warning:
          apify.source === "instagram-post-scraper"
            ? "Fetched latest comments via Apify Post Scraper. For all comments, the Comment Scraper is used automatically when available."
            : undefined,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Apify fetch failed";
    }
  }

  // 2. Browser fallback (no Apify token or Apify failed)
  if (isBrowserScraperEnabled()) {
    try {
      const result = await scrapeInstagramWithDiagnostics(postUrl);
      if (result.comments.length > 0) {
        return {
          comments: result.comments,
          postTitle: result.pageTitle || `Instagram post ${shortcode}`,
          platform: "instagram",
          totalFetched: result.comments.length,
        };
      }
      if (result.error) lastError = result.error;
      else if (result.loginWall) {
        lastError = "Instagram requires login. Add APIFY_TOKEN to .env.local for reliable fetching.";
      } else {
        lastError = `Browser found 0 comments on "${result.pageTitle}"`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Browser scrape failed";
      if (msg.includes("Browser failed to start")) {
        throw new Error("Browser not installed. Run: npx playwright install chromium");
      }
      lastError = msg;
    }
  }

  // 3. Quick GraphQL (6s)
  try {
    const apiComments = await fetchQuickGraphql(shortcode);
    if (apiComments.length > 0) {
      return {
        comments: apiComments,
        postTitle: `Instagram post ${shortcode}`,
        platform: "instagram",
        totalFetched: apiComments.length,
      };
    }
  } catch {
    /* continue */
  }

  throw new Error(
    lastError ||
      "Could not fetch Instagram comments. Add APIFY_TOKEN to .env.local or paste comments manually."
  );
}
