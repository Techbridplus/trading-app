"use client";

import { Moon, Sun, Trophy, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass border-b border-[rgb(var(--card-border))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight">
              Comment <span className="gradient-text">Giveaway</span>
            </h1>
            <p className="text-xs text-[rgb(var(--muted))] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Pick random winners from social posts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggle}
          className="p-2.5 rounded-xl border border-[rgb(var(--card-border))] hover:bg-[rgb(var(--card-border))]/30 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
}
