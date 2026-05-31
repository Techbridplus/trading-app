import type { Platform } from "@/types";
import { Instagram, Twitter, Youtube, Facebook, Music2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS: Record<
  Platform,
  { label: string; icon: React.ElementType; color: string }
> = {
  instagram: { label: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-600" },
  x: { label: "X (Twitter)", icon: Twitter, color: "from-zinc-700 to-zinc-900 dark:from-zinc-300 dark:to-white" },
  youtube: { label: "YouTube", icon: Youtube, color: "from-red-500 to-red-700" },
  tiktok: { label: "TikTok", icon: Music2, color: "from-cyan-400 to-pink-500" },
  facebook: { label: "Facebook", icon: Facebook, color: "from-blue-500 to-blue-700" },
  custom: { label: "Custom", icon: Globe, color: "from-indigo-500 to-purple-600" },
};

interface PlatformSelectorProps {
  value: Platform;
  onChange: (p: Platform) => void;
}

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {(Object.keys(PLATFORMS) as Platform[]).map((key) => {
        const { label, icon: Icon, color } = PLATFORMS[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium",
              active
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/30"
                : "border-[rgb(var(--card-border))] hover:border-indigo-400/50 hover:bg-indigo-500/5"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white",
                color
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="truncate w-full text-center">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const { label, icon: Icon, color } = PLATFORMS[platform];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[rgb(var(--card-border))]/50">
      <span className={cn("w-4 h-4 rounded flex items-center justify-center bg-gradient-to-br text-white", color)}>
        <Icon className="w-2.5 h-2.5" />
      </span>
      {label}
    </span>
  );
}
