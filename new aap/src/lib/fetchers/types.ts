import type { Comment } from "@/types";
import { countMentions, generateAvatarUrl } from "@/utils/pickWinners";

export interface FetchResult {
  comments: Comment[];
  postTitle: string;
  platform: string;
  totalFetched: number;
  warning?: string;
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function toComment(
  partial: Partial<Comment> & { username: string; text: string },
  index: number
): Comment {
  const username = partial.username.replace(/^@/, "").trim();
  return {
    id: partial.id ?? `fetched-${index}-${username}`,
    username,
    displayName: partial.displayName,
    profilePicture: partial.profilePicture ?? generateAvatarUrl(username),
    text: partial.text.trim(),
    mentionCount: partial.mentionCount ?? countMentions(partial.text),
    likes: partial.likes,
    timestamp: partial.timestamp,
  };
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 20000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "application/json, text/html, */*",
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export { BROWSER_UA };
