"use client";

import React, { useEffect, useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Bookmark } from "lucide-react";
import { loadSaves, removeSave, type GlobalSave } from "@/lib/saved-store";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)         return "just now";
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 86_400_000 * 2) return "yesterday";
  if (diff < 86_400_000 * 7) return `${Math.floor(diff / 86_400_000)} days ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const SavedChatsPage: React.FC = () => {
  const [saves, setSaves]       = useState<GlobalSave[]>([]);
  const [expandedId, setExpanded] = useState<string | null>(null);

  useEffect(() => { setSaves(loadSaves()); }, []);

  const handleDelete = (id: string) => {
    removeSave(id);
    setSaves((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-5">
        <h1 className="text-white font-semibold text-2xl tracking-tight">Saved Chats</h1>
        {saves.length > 0 && (
          <p className="text-white/35 text-xs mt-1">{saves.length} saved response{saves.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-8 pb-8">
        {saves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-white/25" />
            </div>
            <div className="text-center">
              <p className="text-white/70 font-semibold">No saved responses yet</p>
              <p className="text-white/35 text-sm mt-1">
                Click the bookmark icon on any AI response to save it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {saves.map((save) => {
              const isOpen  = expandedId === save.id;
              const sources = Array.isArray(save.sources) ? save.sources : [];

              return (
                <div
                  key={save.id}
                  className="group rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14] overflow-hidden transition-all"
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-semibold leading-snug">
                        {save.question || "Saved response"}
                      </p>
                      {!isOpen && (
                        <p className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">
                          {save.answer}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-white/25 text-[10px]">{relativeTime(save.savedAt)}</span>
                        {sources.map((src) => (
                          <span
                            key={src}
                            className="text-[10px] text-white/40 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded-full"
                          >
                            {src.replace(".txt", "")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => setExpanded(isOpen ? null : save.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/65 hover:bg-white/8 transition-colors"
                      >
                        {isOpen
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(save.id)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded answer */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
                      <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">
                        {save.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
