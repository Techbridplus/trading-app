"use client";

import { useState } from "react";
import { Upload, FileJson, FileText, AlignLeft, Sparkles, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type ImportFormat = "json" | "csv" | "raw";

interface CommentImportProps {
  rawInput: string;
  format: ImportFormat;
  onInputChange: (raw: string) => void;
  onFormatChange: (format: ImportFormat) => void;
  onLoadDemo: () => void;
  onClear: () => void;
  commentCount: number;
}

const FORMATS: { id: ImportFormat; label: string; icon: React.ElementType; hint: string }[] = [
  {
    id: "raw",
    label: "Plain Text",
    icon: AlignLeft,
    hint: "@username: comment text (one per line)",
  },
  {
    id: "json",
    label: "JSON",
    icon: FileJson,
    hint: '[{"username":"user","text":"@friend tagged!","profilePicture":"url"}]',
  },
  {
    id: "csv",
    label: "CSV",
    icon: FileText,
    hint: "username,comment or username,displayName,comment,avatarUrl",
  },
];

export function CommentImport({
  rawInput,
  format,
  onInputChange,
  onFormatChange,
  onLoadDemo,
  onClear,
  commentCount,
}: CommentImportProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onInputChange(text);
      if (file.name.endsWith(".json")) onFormatChange("json");
      else if (file.name.endsWith(".csv")) onFormatChange("csv");
    };
    reader.readAsText(file);
  };

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-500" />
          Import Comments
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[rgb(var(--muted))] flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            {commentCount} loaded
          </span>
          <button type="button" onClick={onLoadDemo} className="btn-secondary text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Load Demo
          </button>
          {commentCount > 0 && (
            <button type="button" onClick={onClear} className="btn-secondary text-xs text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FORMATS.map(({ id, label, icon: Icon, hint }) => (
          <button
            key={id}
            type="button"
            onClick={() => onFormatChange(id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
              format === id
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "border-[rgb(var(--card-border))] hover:border-indigo-400/50"
            )}
            title={hint}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors",
          dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-[rgb(var(--card-border))]"
        )}
      >
        <textarea
          value={rawInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={FORMATS.find((f) => f.id === format)?.hint}
          rows={8}
          className="w-full bg-transparent p-4 text-sm resize-y min-h-[180px] focus:outline-none placeholder:text-[rgb(var(--muted))]/60"
        />
        {!rawInput && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-[rgb(var(--muted))]">
              Paste comments or drag & drop a .json / .csv file
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-4 text-sm space-y-2">
        <p className="font-medium text-indigo-600 dark:text-indigo-400">How to get comments from posts</p>
        <ul className="text-[rgb(var(--muted))] space-y-1 list-disc list-inside text-xs sm:text-sm">
          <li><strong>Instagram / X / TikTok:</strong> Copy comments manually or export via third-party tools, then paste here</li>
          <li><strong>JSON format:</strong> Include username, text, and optionally profilePicture for avatars</li>
          <li><strong>Tag rules:</strong> Set minimum @ mentions to require users tag friends (e.g. tag 2 friends = min 2)</li>
        </ul>
      </div>
    </div>
  );
}
