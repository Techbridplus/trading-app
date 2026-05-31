"use client";

import { History, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { GiveawayResult } from "@/types";
import { PlatformBadge } from "./PlatformSelector";
import Image from "next/image";

interface HistoryPanelProps {
  history: GiveawayResult[];
  onClear: () => void;
  onRestore: (result: GiveawayResult) => void;
}

export function HistoryPanel({ history, onClear, onRestore }: HistoryPanelProps) {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-[rgb(var(--card-border))]/20 transition-colors"
      >
        <span className="font-display font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          Past Giveaways ({history.length})
        </span>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {open && (
        <div className="border-t border-[rgb(var(--card-border))] p-4 space-y-3 max-h-80 overflow-y-auto">
          <div className="flex justify-end">
            <button type="button" onClick={onClear} className="btn-secondary text-xs text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          </div>
          {history.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onRestore(entry)}
              className="w-full text-left p-4 rounded-xl border border-[rgb(var(--card-border))] hover:border-indigo-400/50 hover:bg-indigo-500/5 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <PlatformBadge platform={entry.platform} />
                <span className="text-xs text-[rgb(var(--muted))]">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm font-medium truncate">{entry.postTitle || "Untitled giveaway"}</p>
              <div className="flex items-center gap-2 mt-2">
                {entry.winners.slice(0, 5).map((w) => (
                  <Image
                    key={w.id}
                    src={w.profilePicture ?? ""}
                    alt={w.username}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full ring-2 ring-[rgb(var(--card))]"
                    unoptimized
                  />
                ))}
                <span className="text-xs text-[rgb(var(--muted))]">
                  {entry.winners.length} winner{entry.winners.length !== 1 ? "s" : ""} · {entry.totalEligible} eligible
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
