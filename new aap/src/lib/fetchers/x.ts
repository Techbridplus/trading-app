import { fetchWithTimeout, type FetchResult } from "./types";
import { isBrowserScraperEnabled, scrapeXComments } from "./browser";
import { syndicationToComment, type SyndicationResponse } from "./xSyndication";

async function fetchSyndication(tweetId: string): Promise<FetchResult> {
  const res = await fetchWithTimeout(
    `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${Math.floor(Math.random() * 999999)}`,
    { headers: { Referer: "https://platform.twitter.com/" } },
    8_000
  );

  if (!res.ok) {
    throw new Error(`X/Twitter returned ${res.status}`);
  }

  const data = (await res.json()) as SyndicationResponse;
  const comments = [];

  if (data.conversation?.length) {
    for (const item of data.conversation) {
      if (item.id_str !== tweetId) {
        comments.push(syndicationToComment(item, comments.length));
      }
    }
  }

  if (comments.length === 0) {
    throw new Error("No replies in syndication response");
  }

  return {
    comments,
    postTitle: data.text?.slice(0, 120) ?? `X post ${tweetId}`,
    platform: "x",
    totalFetched: comments.length,
  };
}

export async function fetchXComments(tweetId: string, postUrl?: string): Promise<FetchResult> {
  // 1. Fast syndication API (~1s)
  try {
    return await fetchSyndication(tweetId);
  } catch {
    /* fall through */
  }

  // 2. Browser scraper (~15–30s)
  if (isBrowserScraperEnabled() && postUrl) {
    try {
      const browserComments = await scrapeXComments(postUrl);
      if (browserComments.length > 0) {
        return {
          comments: browserComments,
          postTitle: `X post ${tweetId}`,
          platform: "x",
          totalFetched: browserComments.length,
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Browser failed to start")) {
        throw new Error(
          "Browser not installed. Run: npx playwright install chromium — then try again."
        );
      }
      throw err;
    }
  }

  throw new Error(
    "Could not fetch X replies. The post may have no replies or be private. Paste comments manually."
  );
}
