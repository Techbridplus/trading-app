"use client";

import type { FilterSettings } from "@/types";
import { Settings2, Users, AtSign, Hash, Ban, Filter } from "lucide-react";

interface FilterPanelProps {
  settings: FilterSettings;
  onChange: (settings: FilterSettings) => void;
  eligibleCount: number;
  totalCount: number;
}

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Icon className="w-4 h-4 text-indigo-500" />
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </div>
  );
}

export function FilterPanel({ settings, onChange, eligibleCount, totalCount }: FilterPanelProps) {
  const update = (partial: Partial<FilterSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-500" />
          Giveaway Settings
        </h2>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-500">{eligibleCount}</p>
          <p className="text-xs text-[rgb(var(--muted))]">of {totalCount} eligible</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Minimum @ Mentions" hint="Comments must tag at least this many people" icon={AtSign}>
          <input
            type="number"
            min={0}
            max={50}
            value={settings.minMentions}
            onChange={(e) => update({ minMentions: Math.max(0, parseInt(e.target.value) || 0) })}
            className="input-field"
          />
        </Field>

        <Field label="Winners to Pick" hint="How many random winners to select" icon={Users}>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.winnerCount}
            onChange={(e) => update({ winnerCount: Math.max(1, parseInt(e.target.value) || 1) })}
            className="input-field"
          />
        </Field>

        <Field label="Required Keywords" hint="Comma-separated words that must appear" icon={Hash}>
          <input
            type="text"
            placeholder="giveaway, win, tagged"
            value={settings.requiredKeywords}
            onChange={(e) => update({ requiredKeywords: e.target.value })}
            className="input-field"
          />
        </Field>

        <Field label="Min Comment Length" hint="Minimum characters in comment" icon={Filter}>
          <input
            type="number"
            min={0}
            max={500}
            value={settings.minCommentLength}
            onChange={(e) => update({ minCommentLength: Math.max(0, parseInt(e.target.value) || 0) })}
            className="input-field"
          />
        </Field>

        <Field label="Your Username (optional)" hint="Exclude comments that mention you" icon={AtSign}>
          <input
            type="text"
            placeholder="your_username"
            value={settings.selfUsername}
            onChange={(e) => update({ selfUsername: e.target.value })}
            className="input-field"
          />
        </Field>

        <Field label="Exclude Usernames" hint="Comma-separated usernames to block" icon={Ban}>
          <input
            type="text"
            placeholder="bot_account, spam_user"
            value={settings.excludeUsernames}
            onChange={(e) => update({ excludeUsernames: e.target.value })}
            className="input-field"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={settings.uniqueUsersOnly}
            onChange={(e) => update({ uniqueUsersOnly: e.target.checked })}
            className="w-4 h-4 rounded border-[rgb(var(--card-border))] text-indigo-500 focus:ring-indigo-500"
          />
          One entry per user (deduplicate)
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={settings.excludeSelfMention}
            onChange={(e) => update({ excludeSelfMention: e.target.checked })}
            className="w-4 h-4 rounded border-[rgb(var(--card-border))] text-indigo-500 focus:ring-indigo-500"
          />
          Exclude self-mentions
        </label>
      </div>
    </div>
  );
}
