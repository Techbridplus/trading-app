import type { Comment, FilterSettings } from "@/types";
import { countMentions, dedupeByUsername, generateAvatarUrl, normalizeUsername } from "./pickWinners";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `comment-${Date.now()}-${idCounter}`;
}

function buildComment(partial: Partial<Comment> & { username: string; text: string }): Comment {
  const username = partial.username.replace(/^@/, "").trim();
  return {
    id: partial.id ?? nextId(),
    username,
    displayName: partial.displayName,
    profilePicture: partial.profilePicture ?? generateAvatarUrl(username),
    text: partial.text.trim(),
    mentionCount: partial.mentionCount ?? countMentions(partial.text),
    likes: partial.likes,
    timestamp: partial.timestamp,
  };
}

/** Parse JSON array or object with comments field */
export function parseJsonComments(raw: string): Comment[] {
  const data = JSON.parse(raw);
  const items = Array.isArray(data) ? data : data.comments ?? data.data ?? [];

  return items.map((item: Record<string, unknown>) => {
    const username =
      String(item.username ?? item.user ?? item.author ?? item.handle ?? "unknown");
    const text = String(item.text ?? item.comment ?? item.content ?? item.body ?? "");
    const profilePicture = item.profilePicture ?? item.avatar ?? item.profile_pic_url ?? item.profile_image_url;

    return buildComment({
      id: item.id ? String(item.id) : undefined,
      username,
      displayName: item.displayName ? String(item.displayName) : item.name ? String(item.name) : undefined,
      profilePicture: profilePicture ? String(profilePicture) : undefined,
      text,
      likes: typeof item.likes === "number" ? item.likes : undefined,
      timestamp: item.timestamp ? String(item.timestamp) : undefined,
    });
  });
}

/** Parse CSV: username,text or username,displayName,text,profilePicture */
export function parseCsvComments(raw: string): Comment[] {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("username") || header.includes("comment");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map((p) =>
      p.replace(/^"|"$/g, "").trim()
    ) ?? line.split(",").map((p) => p.trim());

    const [username, second, third, fourth] = parts;
    const isExtended = parts.length >= 3 && !second.startsWith("@") && second.length < 40;

    if (isExtended && parts.length >= 3) {
      return buildComment({
        username,
        displayName: second,
        text: third,
        profilePicture: fourth || undefined,
      });
    }

    return buildComment({ username, text: second ?? third ?? "" });
  });
}

/**
 * Parse raw pasted comments:
 * @username: comment text
 * username — comment
 * [username] comment
 */
export function parseRawComments(raw: string): Comment[] {
  const lines = raw.trim().split(/\r?\n/).filter((l) => l.trim());
  const comments: Comment[] = [];

  for (const line of lines) {
    let match =
      line.match(/^@?([\w.]+)\s*[:\-–—|]\s*(.+)$/i) ??
      line.match(/^\[([^\]]+)\]\s*(.+)$/) ??
      line.match(/^@([\w.]+)\s+(.+)$/);

    if (match) {
      comments.push(buildComment({ username: match[1], text: match[2] }));
      continue;
    }

    const mentionOnly = line.match(/^@([\w.]+)$/);
    if (mentionOnly) {
      comments.push(buildComment({ username: mentionOnly[1], text: line }));
    }
  }

  return comments;
}

export function parseComments(raw: string, format: "json" | "csv" | "raw"): Comment[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  switch (format) {
    case "json":
      return parseJsonComments(trimmed);
    case "csv":
      return parseCsvComments(trimmed);
    case "raw":
      return parseRawComments(trimmed);
    default:
      return [];
  }
}

export function applyFilters(comments: Comment[], settings: FilterSettings): Comment[] {
  const excludeSet = new Set(
    settings.excludeUsernames
      .split(/[,;\n]/)
      .map(normalizeUsername)
      .filter(Boolean)
  );

  const keywords = settings.requiredKeywords
    .split(/[,;\n]/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const selfUser = normalizeUsername(settings.selfUsername);

  let filtered = comments.filter((c) => {
    if (c.mentionCount < settings.minMentions) return false;
    if (c.text.length < settings.minCommentLength) return false;
    if (excludeSet.has(normalizeUsername(c.username))) return false;

    if (settings.excludeSelfMention && selfUser) {
      const selfPattern = new RegExp(`@${selfUser}\\b`, "i");
      if (selfPattern.test(c.text)) return false;
    }

    if (keywords.length > 0) {
      const lower = c.text.toLowerCase();
      if (!keywords.every((kw) => lower.includes(kw))) return false;
    }

    return true;
  });

  if (settings.uniqueUsersOnly) {
    filtered = dedupeByUsername(filtered);
  }

  return filtered;
}
