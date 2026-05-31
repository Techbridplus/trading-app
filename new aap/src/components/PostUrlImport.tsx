"use client";

import { useState, useEffect, useRef } from "react";
import { Link2, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import type { Comment, Platform } from "@/types";
import { parsePostUrl } from "@/lib/urlParser";
import { PlatformBadge } from "./PlatformSelector";
import { cn } from "@/lib/utils";

interface PostUrlImportProps {
  onCommentsLoaded: (comments: Comment[], meta: { postTitle: string; platform: Platform; url: string }) => void;
  onClear: () => void;
  commentCount: number;
  onFetchFailed?: () => void;
}

const LOADING_STEPS = [
  "Connecting to post…",
  "Opening page in browser…",
  "Scrolling to load comments…",
  "Extracting usernames & text…",
];

export function PostUrlImport({ onCommentsLoaded, onClear, commentCount, onFetchFailed }: PostUrlImportProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loadedMeta, setLoadedMeta] = useState<{ postTitle: string; platform: Platform; total: number } | null>(null);
  const [loadingStep, setLoadingStep] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const detected = parsePostUrl(url);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep("");
      return;
    }
    let i = 0;
    setLoadingStep(LOADING_STEPS[0]);
    const interval = setInterval(() => {
      i = Math.min(i + 1, LOADING_STEPS.length - 1);
      setLoadingStep(LOADING_STEPS[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFetch = async () => {
    if (!url.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setWarning(null);
    setLoadedMeta(null);

    const clientTimeout = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch("/api/fetch-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });

      const data = (await res.json()) as {
        success?: boolean;
        comments?: Comment[];
        postTitle?: string;
        platform?: Platform;
        totalFetched?: number;
        warning?: string;
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to fetch comments.");
      }

      const comments = data.comments ?? [];
      const platform = data.platform ?? "custom";
      const postTitle = data.postTitle ?? "Post";

      setLoadedMeta({ postTitle, platform, total: data.totalFetched ?? comments.length });
      if (data.warning) setWarning(data.warning);

      onCommentsLoaded(comments, { postTitle, platform, url: url.trim() });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out after 55 seconds. Try again or paste comments manually.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
      onFetchFailed?.();
    } finally {
      clearTimeout(clientTimeout);
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setError(null);
    setWarning(null);
    setLoadedMeta(null);
    onClear();
  };

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Link2 className="w-5 h-5 text-indigo-500" />
          Paste Post URL
        </h2>
        {commentCount > 0 && loadedMeta && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {commentCount} comments loaded
          </span>
        )}
      </div>

      <p className="text-sm text-[rgb(var(--muted))]">
        Paste an Instagram, X (Twitter), or YouTube post link — comments are fetched automatically.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleFetch()}
            placeholder="https://www.instagram.com/p/ABC123/ or https://x.com/user/status/123..."
            className="input-field"
            disabled={isLoading}
          />
          {detected && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[rgb(var(--muted))]">Detected:</span>
              <PlatformBadge platform={detected.platform} />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={!url.trim() || isLoading}
          className="btn-primary sm:min-w-[160px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {loadingStep || "Fetching…"}
            </>
          ) : (
            <>
              <Link2 className="w-5 h-5" />
              Fetch Comments
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-sm text-indigo-600 dark:text-indigo-400 animate-pulse">
          {loadingStep} — usually takes 15–35 seconds for Instagram/X posts.
        </div>
      )}

      {loadedMeta && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <PlatformBadge platform={loadedMeta.platform} />
            <span className="text-sm font-medium">{loadedMeta.total} comments fetched</span>
          </div>
          <p className="text-sm text-[rgb(var(--muted))] line-clamp-2">{loadedMeta.postTitle}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline"
          >
            View original post <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {warning && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-700 dark:text-amber-400 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {warning}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-600 dark:text-red-400 space-y-2">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
          <p className="text-xs opacity-90 pl-6">
            Instagram &amp; X often block automated fetching. Use <strong>“Or paste comments manually”</strong> below, or add <code className="text-[10px] bg-black/10 px-1 rounded">APIFY_TOKEN</code> in <code className="text-[10px] bg-black/10 px-1 rounded">.env.local</code> for Instagram.
          </p>
        </div>
      )}

      {commentCount > 0 && (
        <button type="button" onClick={handleClear} className={cn("btn-secondary text-sm")}>
          Clear & start over
        </button>
      )}

      <div className="grid sm:grid-cols-3 gap-3 text-xs text-[rgb(var(--muted))]">
        <div className="rounded-lg border border-[rgb(var(--card-border))] p-3">
          <strong className="text-[rgb(var(--foreground))]">Instagram</strong>
          <p className="mt-1">/p/, /reel/, /tv/ links</p>
        </div>
        <div className="rounded-lg border border-[rgb(var(--card-border))] p-3">
          <strong className="text-[rgb(var(--foreground))]">X (Twitter)</strong>
          <p className="mt-1">/status/123456789 links</p>
        </div>
        <div className="rounded-lg border border-[rgb(var(--card-border))] p-3">
          <strong className="text-[rgb(var(--foreground))]">YouTube</strong>
          <p className="mt-1">Requires YOUTUBE_API_KEY in .env.local</p>
        </div>
      </div>
    </div>
  );
}
