"use client";

import { useEffect, useState } from "react";
import type { GiveawayResult } from "@/types";

const STORAGE_KEY = "giveaway-history";

export function useGiveawayHistory() {
  const [history, setHistory] = useState<GiveawayResult[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      setHistory([]);
    }
  }, []);

  const save = (result: GiveawayResult) => {
    setHistory((prev) => {
      const next = [result, ...prev].slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  return { history, save, clear };
}
