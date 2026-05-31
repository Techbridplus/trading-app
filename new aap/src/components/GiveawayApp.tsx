"use client";

import { useMemo, useState, useCallback } from "react";
import { Shuffle, Download, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/Header";
import { PostUrlImport } from "@/components/PostUrlImport";
import { CommentImport } from "@/components/CommentImport";
import { FilterPanel } from "@/components/FilterPanel";
import { WinnerList } from "@/components/WinnerList";
import { HistoryPanel } from "@/components/HistoryPanel";
import { DEFAULT_FILTERS, type Comment, type FilterSettings, type GiveawayResult, type Platform } from "@/types";
import { applyFilters, parseComments } from "@/utils/parseComments";
import { pickWinners, exportWinnersCsv, downloadFile } from "@/utils/pickWinners";
import { getDemoComments } from "@/utils/demoData";
import { fireConfetti } from "@/utils/confetti";
import { useGiveawayHistory } from "@/hooks/useGiveawayHistory";

type ImportFormat = "json" | "csv" | "raw";

export function GiveawayApp() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [postTitle, setPostTitle] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [format, setFormat] = useState<ImportFormat>("raw");
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [comments, setComments] = useState<Comment[]>([]);
  const [winners, setWinners] = useState<Comment[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [showManualImport, setShowManualImport] = useState(false);

  const { history, save, clear } = useGiveawayHistory();

  const { activeComments, parseError: currentParseError } = useMemo(() => {
    if (!rawInput.trim()) {
      return { activeComments: comments, parseError: null as string | null };
    }
    try {
      return {
        activeComments: parseComments(rawInput, format),
        parseError: null as string | null,
      };
    } catch {
      return {
        activeComments: comments,
        parseError: "Failed to parse comments. Check your format.",
      };
    }
  }, [rawInput, format, comments]);

  const eligibleComments = useMemo(
    () => applyFilters(activeComments, filters),
    [activeComments, filters]
  );

  const handleCommentsFromUrl = (
    loaded: Comment[],
    meta: { postTitle: string; platform: Platform; url: string }
  ) => {
    setComments(loaded);
    setRawInput("");
    setPostTitle(meta.postTitle);
    setPlatform(meta.platform);
    setPostUrl(meta.url);
    setWinners([]);
  };

  const handleLoadDemo = () => {
    setComments(getDemoComments());
    setRawInput("");
    setPostUrl("");
    setPostTitle("Demo giveaway post");
  };

  const handleClear = () => {
    setRawInput("");
    setComments([]);
    setWinners([]);
    setPostUrl("");
    setPostTitle("");
  };

  const handlePickWinners = useCallback(() => {
    if (eligibleComments.length === 0) return;

    setIsPicking(true);
    setWinners([]);

    setTimeout(() => {
      const picked = pickWinners(eligibleComments, filters.winnerCount);
      setWinners(picked);
      setIsPicking(false);
      fireConfetti();

      const result: GiveawayResult = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        platform,
        postTitle: postTitle || `${platform} giveaway`,
        winners: picked,
        totalEligible: eligibleComments.length,
        totalComments: activeComments.length,
        settings: { ...filters },
      };
      save(result);
    }, 1500);
  }, [eligibleComments, filters, platform, postTitle, activeComments.length, save]);

  const handleExport = () => {
    if (winners.length === 0) return;
    downloadFile(exportWinnersCsv(winners), `winners-${Date.now()}.csv`, "text/csv");
  };

  const handleRestore = (result: GiveawayResult) => {
    setWinners(result.winners);
    setPlatform(result.platform);
    setPostTitle(result.postTitle);
    setFilters(result.settings);
  };

  const canPick = eligibleComments.length > 0 && !isPicking;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <PostUrlImport
          onCommentsLoaded={handleCommentsFromUrl}
          onClear={handleClear}
          commentCount={activeComments.length}
          onFetchFailed={() => setShowManualImport(true)}
        />

        {/* Manual import fallback */}
        <div className="glass rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowManualImport(!showManualImport)}
            className="w-full flex items-center justify-between p-5 hover:bg-[rgb(var(--card-border))]/20 transition-colors text-left"
          >
            <span className="font-medium text-sm text-[rgb(var(--muted))]">
              Or paste comments manually / load demo
            </span>
            {showManualImport ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showManualImport && (
            <div className="border-t border-[rgb(var(--card-border))] p-4">
              <CommentImport
                rawInput={rawInput}
                format={format}
                onInputChange={setRawInput}
                onFormatChange={setFormat}
                onLoadDemo={handleLoadDemo}
                onClear={handleClear}
                commentCount={activeComments.length}
              />
            </div>
          )}
        </div>

        {currentParseError && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-600 dark:text-red-400">
            {currentParseError}
          </div>
        )}

        <FilterPanel
          settings={filters}
          onChange={setFilters}
          eligibleCount={eligibleComments.length}
          totalCount={activeComments.length}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePickWinners}
            disabled={!canPick}
            className="btn-primary flex-1 sm:flex-none min-w-[200px]"
          >
            <Shuffle className="w-5 h-5" />
            Pick {filters.winnerCount} Winner{filters.winnerCount !== 1 ? "s" : ""}
          </button>

          {winners.length > 0 && (
            <>
              <button type="button" onClick={handleExport} className="btn-secondary">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button type="button" onClick={() => setWinners([])} className="btn-secondary">
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </>
          )}
        </div>

        {!canPick && activeComments.length > 0 && eligibleComments.length === 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-700 dark:text-amber-400">
            No comments match your filters. Try lowering minimum mentions or adjusting keyword requirements.
          </div>
        )}

        <WinnerList winners={winners} isPicking={isPicking} />

        <HistoryPanel history={history} onClear={clear} onRestore={handleRestore} />
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-[rgb(var(--muted))]">
        Paste a post URL to fetch comments · Fair Fisher-Yates random pick · Export winners anytime
        {postUrl && (
          <span className="block mt-1 truncate max-w-md mx-auto opacity-60">{postUrl}</span>
        )}
      </footer>
    </div>
  );
}
