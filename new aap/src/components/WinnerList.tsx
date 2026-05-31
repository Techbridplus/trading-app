"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { AtSign, Heart, Trophy, Crown } from "lucide-react";
import type { Comment } from "@/types";
import { cn } from "@/lib/utils";

interface WinnerCardProps {
  winner: Comment;
  rank: number;
  index: number;
}

export function WinnerCard({ winner, rank, index }: WinnerCardProps) {
  const isFirst = rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.12, type: "spring", stiffness: 200 }}
      className={cn(
        "relative glass rounded-2xl p-5 overflow-hidden",
        isFirst && "ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10"
      )}
    >
      {isFirst && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-bl-full" />
      )}

      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-16 h-16 rounded-full overflow-hidden ring-2",
              isFirst ? "ring-amber-400" : "ring-indigo-500/30"
            )}
          >
            <Image
              src={winner.profilePicture ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.username}`}
              alt={winner.username}
              width={64}
              height={64}
              className="w-full h-full object-cover bg-[rgb(var(--card-border))]"
              unoptimized
            />
          </div>
          <span
            className={cn(
              "absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md",
              isFirst ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-indigo-500 to-purple-600"
            )}
          >
            {isFirst ? <Crown className="w-3.5 h-3.5" /> : rank}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-lg">@{winner.username}</h3>
            {isFirst && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-600 dark:text-amber-400">
                🏆 Winner
              </span>
            )}
          </div>
          {winner.displayName && (
            <p className="text-sm text-[rgb(var(--muted))]">{winner.displayName}</p>
          )}
          <p className="mt-2 text-sm leading-relaxed break-words">{winner.text}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-[rgb(var(--muted))]">
            <span className="flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5" />
              {winner.mentionCount} mention{winner.mentionCount !== 1 ? "s" : ""}
            </span>
            {winner.likes !== undefined && (
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {winner.likes}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface WinnerListProps {
  winners: Comment[];
  isPicking: boolean;
}

export function WinnerList({ winners, isPicking }: WinnerListProps) {
  if (isPicking) {
    return (
      <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500"
        />
        <p className="font-display font-semibold text-lg gradient-text">Picking winners...</p>
        <p className="text-sm text-[rgb(var(--muted))]">Using cryptographically fair random selection</p>
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-indigo-500/50" />
        </div>
        <p className="font-medium text-[rgb(var(--muted))]">No winners yet</p>
        <p className="text-sm text-[rgb(var(--muted))]/70 max-w-sm">
          Import comments, set your filters, then click Pick Winners to randomly select
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-xl flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          Winners ({winners.length})
        </h2>
      </div>
      <div className="grid gap-4">
        {winners.map((winner, i) => (
          <WinnerCard key={winner.id} winner={winner} rank={i + 1} index={i} />
        ))}
      </div>
    </div>
  );
}
