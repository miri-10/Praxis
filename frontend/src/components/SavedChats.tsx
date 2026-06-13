"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Trash2, ChevronDown, ChevronUp, Loader2, Bookmark } from "lucide-react";
import { getSavedChats, deleteChat } from "@/lib/api";

interface SavedChat {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  created_at: string;
}

interface SavedChatsProps {
  projectId: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const SavedChats: React.FC<SavedChatsProps> = ({ projectId }) => {
  const [chats, setChats]       = useState<SavedChat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expandedId, setExpanded] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      const data = await getSavedChats(projectId);
      setChats(Array.isArray(data) ? data : []);
    } catch {
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const handleDelete = async (id: string) => {
    try {
      await deleteChat(projectId, id);
      setChats((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-white/30" />
        </div>
        <p className="text-white/50 text-sm font-medium">No saved answers yet</p>
        <p className="text-white/30 text-xs text-center max-w-xs">
          Save answers from Legal Chat to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {chats.map((chat) => {
        const isOpen = expandedId === chat.id;
        const sources: string[] = Array.isArray(chat.sources) ? chat.sources : [];

        return (
          <div
            key={chat.id}
            className="group rounded-xl border border-white/10 bg-white/4 hover:border-white/18 transition-all overflow-hidden"
          >
            {/* Header row */}
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm font-semibold leading-snug">{chat.question}</p>
                {!isOpen && (
                  <p className="text-white/45 text-xs mt-1 leading-relaxed line-clamp-2">
                    {chat.answer}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-white/30 text-[10px]">{formatDate(chat.created_at)}</span>
                  {sources.map((src) => (
                    <span key={src} className="text-[10px] text-white/45 bg-white/8 border border-white/10 px-1.5 py-0.5 rounded-full">
                      {src.replace(".txt", "")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setExpanded(isOpen ? null : chat.id)}
                  className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/10 transition-colors"
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(chat.id)}
                  className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded answer */}
            {isOpen && (
              <div className="px-4 pb-4 border-t border-white/8 pt-3">
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{chat.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
