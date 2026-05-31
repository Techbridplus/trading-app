import type { Comment } from "@/types";

export function countMentions(text: string): number {
  const matches = text.match(/(?<![\w.])@[\w.]+/g);
  return matches?.length ?? 0;
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex =
      typeof crypto !== "undefined" && crypto.getRandomValues
        ? crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
        : Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }
  return result;
}

export function pickWinners(comments: Comment[], count: number): Comment[] {
  if (count <= 0 || comments.length === 0) return [];
  return shuffle(comments).slice(0, Math.min(count, comments.length));
}

export function generateAvatarUrl(username: string): string {
  const seed = encodeURIComponent(username.toLowerCase());
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

export function normalizeUsername(raw: string): string {
  return raw.replace(/^@/, "").trim().toLowerCase();
}

export function dedupeByUsername(comments: Comment[]): Comment[] {
  const seen = new Set<string>();
  return comments.filter((c) => {
    const key = normalizeUsername(c.username);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function exportWinnersCsv(winners: Comment[]): string {
  const header = "Rank,Username,Display Name,Comment,Mentions,Likes";
  const rows = winners.map((w, i) =>
    [
      i + 1,
      w.username,
      w.displayName ?? "",
      `"${w.text.replace(/"/g, '""')}"`,
      w.mentionCount,
      w.likes ?? 0,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
