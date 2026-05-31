import type { Comment } from "@/types";
import { toComment } from "./types";
import { withTimeout } from "@/lib/withTimeout";

const SCRAPE_TIMEOUT_MS = 45_000;

export interface ScrapeDiagnostics {
  comments: Comment[];
  loginWall: boolean;
  pageTitle: string;
  error?: string;
}

let browserPromise: Promise<import("playwright-core").Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = withTimeout(
      (async () => {
        const { chromium } = await import("playwright-core");
        return chromium.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });
      })(),
      15_000,
      "Browser failed to start. Run: npx playwright install chromium"
    );
  }
  return browserPromise;
}

interface RawComment {
  username: string;
  text: string;
  avatar?: string;
  displayName?: string;
  id?: string;
  likes?: number;
}

function dedupeRaw(items: RawComment[]): RawComment[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.username}:${item.text.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractIgCommentsFromJson(data: unknown, out: RawComment[]) {
  if (!data || typeof data !== "object") return;

  const walk = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }

    const record = obj as Record<string, unknown>;

    if (record.edges && Array.isArray(record.edges)) {
      for (const edge of record.edges) {
        const node = (edge as { node?: Record<string, unknown> })?.node;
        if (!node) continue;
        const owner = node.owner as Record<string, string> | undefined;
        const text = node.text;
        if (owner?.username && typeof text === "string" && text.trim()) {
          out.push({
            id: node.id ? String(node.id) : undefined,
            username: owner.username,
            displayName: owner.full_name,
            avatar: owner.profile_pic_url,
            text: text.trim(),
            likes: (node.edge_liked_by as { count?: number })?.count,
          });
        }
      }
    }

    Object.values(record).forEach(walk);
  };

  walk(data);
}

function extractXCommentsFromJson(data: unknown, out: RawComment[]) {
  if (!data || typeof data !== "object") return;

  const walk = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }

    const record = obj as Record<string, unknown>;
    const legacy = record.legacy as Record<string, unknown> | undefined;
    const core = record.core as { user_results?: { result?: { legacy?: Record<string, string> } } } | undefined;
    const userLegacy = core?.user_results?.result?.legacy;

    const text = legacy?.full_text ?? record.full_text ?? record.text;
    const username =
      userLegacy?.screen_name ??
      (record.user as { screen_name?: string })?.screen_name ??
      (record.user as { legacy?: { screen_name?: string } })?.legacy?.screen_name;

    if (typeof text === "string" && text.trim() && typeof username === "string") {
      const avatar =
        userLegacy?.profile_image_url_https ??
        (record.user as { profile_image_url_https?: string })?.profile_image_url_https;
      out.push({
        username,
        text: text.trim(),
        avatar,
        displayName: userLegacy?.name,
        id: record.rest_id ? String(record.rest_id) : record.id_str ? String(record.id_str) : undefined,
        likes: legacy?.favorite_count as number | undefined,
      });
    }

    Object.values(record).forEach(walk);
  };

  walk(data);
}

function rawToComments(items: RawComment[]): Comment[] {
  return dedupeRaw(items).map((item, i) =>
    toComment(
      {
        id: item.id,
        username: item.username,
        displayName: item.displayName,
        profilePicture: item.avatar,
        text: item.text,
        likes: item.likes,
      },
      i
    )
  );
}

async function createContext(browser: import("playwright-core").Browser) {
  return browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
  });
}

export async function scrapeInstagramComments(postUrl: string): Promise<Comment[]> {
  const result = await withTimeout(
    scrapeInstagramInner(postUrl),
    SCRAPE_TIMEOUT_MS,
    "Instagram fetch timed out after 45s"
  );
  return result.comments;
}

async function scrapeInstagramInner(postUrl: string): Promise<ScrapeDiagnostics> {
  const browser = await getBrowser();
  const context = await createContext(browser);
  const page = await context.newPage();
  const networkComments: RawComment[] = [];

  page.on("response", async (response) => {
    try {
      const url = response.url();
      if (!url.includes("instagram.com") || !url.includes("graphql")) return;
      const ct = response.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;
      const json = await response.json();
      extractIgCommentsFromJson(json, networkComments);
    } catch {
      /* ignore parse errors */
    }
  });

  try {
    await page.goto(postUrl, { waitUntil: "networkidle", timeout: 25_000 }).catch(async () => {
      await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
    });

    await page.waitForTimeout(2000);

    const loginWall =
      (await page.locator('input[name="username"], input[aria-label="Phone number, username, or email"]').count()) > 0;

    for (const selector of [
      'button:has-text("Allow all cookies")',
      'button:has-text("Decline optional cookies")',
      'button:has-text("Allow essential")',
    ]) {
      try {
        await page.locator(selector).first().click({ timeout: 1000 });
      } catch {
        /* optional */
      }
    }

    // Open comments panel if collapsed
    for (const selector of [
      'span:has-text("View all")',
      'a:has-text("View all")',
      'span:has-text("comments")',
    ]) {
      try {
        await page.locator(selector).first().click({ timeout: 1500 });
        await page.waitForTimeout(1500);
        break;
      } catch {
        /* optional */
      }
    }

    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, 700));
      await page.waitForTimeout(500);
    }

    // DOM fallback
    const domComments = await page.evaluate(() => {
      const results: RawComment[] = [];
      const seen = new Set<string>();

      const add = (username: string, text: string, avatar?: string) => {
        if (!username || !text || text.length < 2) return;
        const key = `${username}:${text.slice(0, 80)}`;
        if (seen.has(key)) return;
        seen.add(key);
        results.push({ username, text, avatar });
      };

      document.querySelectorAll('a[href^="/"]').forEach((a) => {
        const href = a.getAttribute("href") ?? "";
        const m = href.match(/^\/([a-zA-Z0-9_.]+)\/?$/);
        if (!m) return;
        const username = m[1];
        if (["p", "reel", "explore", "accounts", "direct", "reels", "stories"].includes(username)) return;

        const container = a.closest("li, div[role='button']") ?? a.parentElement?.parentElement;
        if (!container) return;

        const spans = [...container.querySelectorAll("span")]
          .map((s) => s.textContent?.trim() ?? "")
          .filter((s) => s.length > 1 && s !== username && !/^\d+[hdwm]?$/.test(s) && s !== "Reply" && s !== "Like");
        const text = spans.join(" ").trim();
        const img = container.querySelector("img") as HTMLImageElement | null;
        add(username, text, img?.src);
      });

      return results;
    });

    const allRaw = dedupeRaw([...networkComments, ...domComments]);
    const pageTitle = await page.title();

    if (loginWall && allRaw.length === 0) {
      return {
        comments: [],
        loginWall: true,
        pageTitle,
        error: "Instagram showed a login page. Public comment scraping is blocked — paste comments manually or add APIFY_TOKEN to .env.local.",
      };
    }

    return {
      comments: rawToComments(allRaw),
      loginWall,
      pageTitle,
    };
  } finally {
    await context.close();
  }
}

export async function scrapeXComments(postUrl: string): Promise<Comment[]> {
  const result = await withTimeout(
    scrapeXInner(postUrl),
    SCRAPE_TIMEOUT_MS,
    "X fetch timed out after 45s"
  );
  return result.comments;
}

async function scrapeXInner(postUrl: string): Promise<ScrapeDiagnostics> {
  const browser = await getBrowser();
  const context = await createContext(browser);
  const page = await context.newPage();
  const networkComments: RawComment[] = [];

  page.on("response", async (response) => {
    try {
      const url = response.url();
      if (!url.includes("twitter.com") && !url.includes("x.com")) return;
      if (!url.includes("graphql") && !url.includes("api")) return;
      const ct = response.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;
      const json = await response.json();
      extractXCommentsFromJson(json, networkComments);
    } catch {
      /* ignore */
    }
  });

  try {
    await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 25_000 });
    await page.waitForTimeout(2500);

    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 900));
      await page.waitForTimeout(500);
    }

    const domComments = await page.evaluate(() => {
      const results: RawComment[] = [];
      const seen = new Set<string>();
      const articles = document.querySelectorAll('article[data-testid="tweet"], article');

      articles.forEach((article, index) => {
        if (index === 0) return;
        const userLink = article.querySelector('a[href^="/"][role="link"]') as HTMLAnchorElement | null;
        const href = userLink?.getAttribute("href") ?? "";
        const m = href.match(/^\/([a-zA-Z0-9_]+)$/);
        if (!m) return;
        const username = m[1];
        const text = article.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ?? "";
        if (!text) return;
        const key = `${username}:${text.slice(0, 80)}`;
        if (seen.has(key)) return;
        seen.add(key);
        const img = article.querySelector('img[src*="profile_images"]') as HTMLImageElement | null;
        results.push({ username, text, avatar: img?.src });
      });

      return results;
    });

    const allRaw = dedupeRaw([...networkComments, ...domComments]);
    return {
      comments: rawToComments(allRaw),
      loginWall: false,
      pageTitle: await page.title(),
    };
  } finally {
    await context.close();
  }
}

export function isBrowserScraperEnabled(): boolean {
  return process.env.DISABLE_BROWSER_SCRAPER !== "true";
}

export async function scrapeInstagramWithDiagnostics(postUrl: string) {
  return withTimeout(scrapeInstagramInner(postUrl), SCRAPE_TIMEOUT_MS, "Instagram fetch timed out after 45s");
}
