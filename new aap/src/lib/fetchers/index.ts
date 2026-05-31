import type { Platform } from "@/types";
import { parsePostUrl } from "@/lib/urlParser";
import { fetchInstagramComments } from "./instagram";
import { fetchXComments } from "./x";
import { fetchYouTubeComments } from "./youtube";
import type { FetchResult } from "./types";

export async function fetchCommentsFromUrl(url: string): Promise<FetchResult & { platform: Platform }> {
  const parsed = parsePostUrl(url);
  if (!parsed) {
    throw new Error(
      "Unsupported URL. Paste a link from Instagram, X (Twitter), or YouTube."
    );
  }

  switch (parsed.platform) {
    case "instagram":
      return {
        ...(await fetchInstagramComments(parsed.id, parsed.url)),
        platform: "instagram",
      };
    case "x":
      return {
        ...(await fetchXComments(parsed.id, parsed.url)),
        platform: "x",
      };
    case "youtube":
      return {
        ...(await fetchYouTubeComments(parsed.id)),
        platform: "youtube",
      };
    case "tiktok":
      throw new Error(
        "TikTok URL detected. TikTok blocks automated fetching — please copy comments and paste them in the manual import section."
      );
    case "facebook":
      throw new Error(
        "Facebook URL detected. Facebook requires authentication — please copy comments and paste them manually."
      );
    default:
      throw new Error("Unsupported platform.");
  }
}

export type { FetchResult };
