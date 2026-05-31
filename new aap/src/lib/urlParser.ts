import type { Platform } from "@/types";

export interface ParsedUrl {
  platform: Platform;
  url: string;
  id: string;
}

const PATTERNS: { platform: Platform; regex: RegExp; group?: number }[] = [
  { platform: "instagram", regex: /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i },
  { platform: "x", regex: /(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i },
  { platform: "youtube", regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/i },
  { platform: "tiktok", regex: /tiktok\.com\/@[^/]+\/video\/(\d+)/i },
  { platform: "facebook", regex: /facebook\.com\/(?:[^/]+\/posts\/|photo\.php\?fbid=|reel\/)(\d+)/i },
];

export function parsePostUrl(input: string): ParsedUrl | null {
  const url = input.trim();
  if (!url) return null;

  let normalized = url;
  if (!/^https?:\/\//i.test(url)) {
    normalized = `https://${url}`;
  }

  try {
    new URL(normalized);
  } catch {
    return null;
  }

  for (const { platform, regex } of PATTERNS) {
    const match = normalized.match(regex);
    if (match?.[1]) {
      return { platform, url: normalized, id: match[1] };
    }
  }

  return null;
}

export function isValidPostUrl(input: string): boolean {
  return parsePostUrl(input) !== null;
}
