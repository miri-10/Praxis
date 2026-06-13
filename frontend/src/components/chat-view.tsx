"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Square, Copy, ThumbsUp, ThumbsDown, Bookmark, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import logo from "@/photo/logo.png";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import type { Message } from "@/lib/chat-store";
import { listProjects, saveChat } from "@/lib/api";
import { addSave } from "@/lib/saved-store";

const API = process.env.NEXT_PUBLIC_API_URL || "https://web-production-27a7b.up.railway.app";

// ── Input box ──────────────────────────────────────────────────────────────────

interface InputBoxProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  dark?: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ value, onChange, onSend, isLoading, dark = false }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`;
  }, [value]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div
      className={`flex items-end gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 ${
        dark
          ? "bg-[#1c1c1c] border-white/10 focus-within:border-white/22"
          : "bg-black/15 backdrop-blur-md border-black/12 focus-within:border-black/25"
      }`}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask your cofounder anything — ideas, strategy, product…"
        rows={1}
        disabled={isLoading}
        className={`flex-1 resize-none bg-transparent text-sm leading-relaxed focus:outline-none disabled:opacity-50 ${
          dark
            ? "text-white placeholder:text-white/30"
            : "text-white placeholder:text-white/55"
        }`}
        style={{ minHeight: "24px", maxHeight: "200px", scrollbarWidth: "none" }}
      />
      <button
        onClick={onSend}
        disabled={!canSend && !isLoading}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
          isLoading
            ? "bg-white/15 cursor-not-allowed"
            : canSend
            ? "bg-white hover:bg-white/90 text-black"
            : "bg-white/12 text-white/30 cursor-not-allowed"
        }`}
      >
        {isLoading ? (
          <Square className="w-3 h-3 fill-white/50 text-white/50 animate-pulse" />
        ) : (
          <ArrowUp className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};

// ── Messages ───────────────────────────────────────────────────────────────────

const UserMessage: React.FC<{ msg: Message }> = ({ msg }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="flex justify-end"
  >
    <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm bg-white/10 border border-white/8">
      <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
    </div>
  </motion.div>
);

// ── Save modal ─────────────────────────────────────────────────────────────────

interface SaveModalProps {
  question: string;
  answer: string;
  sources: string[];
  onClose: () => void;
  onSaved: () => void;
}

function SaveModal({ question, answer, sources, onClose, onSaved }: SaveModalProps) {
  const [saveGlobal, setSaveGlobal] = useState(true);
  const [projects, setProjects]     = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    listProjects()
      .then((raw: { id: string; name: string }[]) => setProjects(Array.isArray(raw) ? raw : []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  const toggleProject = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (saveGlobal) addSave({ question, answer, sources });
      if (selected.size > 0) {
        await Promise.all(
          [...selected].map((id) => saveChat(id, { question, answer, sources }).catch(() => null))
        );
      }
    } finally {
      onSaved();
      onClose();
    }
  };

  const canSave = saveGlobal || selected.size > 0;

  const CheckBox = ({ on }: { on: boolean }) => (
    <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
      on ? "bg-violet-500 border-violet-500" : "border-white/25"
    }`}>
      {on && <Check className="w-2.5 h-2.5 text-white" />}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={!saving ? onClose : undefined} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#1c1d21] shadow-2xl p-5 flex flex-col gap-4">
        <h3 className="text-white font-semibold text-sm">Save response</h3>

        {/* Saved Chats toggle */}
        <button
          onClick={() => setSaveGlobal(!saveGlobal)}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left w-full transition-all ${
            saveGlobal
              ? "border-violet-500/25 bg-violet-500/[0.08]"
              : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
          }`}
        >
          <CheckBox on={saveGlobal} />
          <div>
            <p className="text-white text-sm font-medium">Saved Chats</p>
            <p className="text-white/40 text-xs mt-0.5">Quick-access from the sidebar</p>
          </div>
        </button>

        {/* Projects */}
        <div className="flex flex-col gap-2">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">
            Also save to project
          </p>
          {loadingProjects ? (
            <div className="flex items-center gap-2 text-white/30 text-xs py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading…
            </div>
          ) : projects.length === 0 ? (
            <p className="text-white/25 text-xs py-1">
              No projects yet — create one in the Projects tab.
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
              {projects.map((p) => {
                const on = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProject(p.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left w-full transition-all ${
                      on
                        ? "border-violet-500/25 bg-violet-500/[0.08]"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <CheckBox on={on} />
                    <span className="text-white/80 text-sm truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-white/55 text-sm hover:bg-white/[0.05] disabled:opacity-40 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-2.5 rounded-xl bg-[#16131f] hover:bg-[#1e1a2e] border border-violet-500/20 hover:border-violet-400/35 text-white/80 hover:text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Assistant message ──────────────────────────────────────────────────────────

const AssistantMessage: React.FC<{ msg: Message; question: string }> = ({ msg, question }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saved, setSaved]                = useState(false);

  const copy = () => navigator.clipboard.writeText(msg.content).catch(() => {});

  const handleSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 group"
    >
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5 shadow-md">
        <Image src={logo} alt="Praxis" width={28} height={28} className="object-contain w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/82 text-sm leading-[1.75] whitespace-pre-wrap">{msg.content}</p>
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {msg.sources.map((src) => (
              <span
                key={src}
                className="text-[10px] text-white/40 bg-white/6 border border-white/10 px-2 py-0.5 rounded-full"
              >
                {src.replace(".txt", "")}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button title="Copy" onClick={copy}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/65 hover:bg-white/8 transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button title="Good response" onClick={() => {}}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/65 hover:bg-white/8 transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button title="Bad response" onClick={() => {}}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/65 hover:bg-white/8 transition-colors">
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            title={saved ? "Saved!" : "Save response"}
            onClick={() => !saved && setShowSaveModal(true)}
            className={`p-1.5 rounded-lg transition-colors ${
              saved
                ? "text-violet-400"
                : "text-white/30 hover:text-white/65 hover:bg-white/8"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-violet-400" : ""}`} />
          </button>
        </div>
      </div>

      {showSaveModal && (
        <SaveModal
          question={question}
          answer={msg.content}
          sources={msg.sources ?? []}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaved}
        />
      )}
    </motion.div>
  );
};

const ThinkingDots: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
      <Image src={logo} alt="Praxis" width={28} height={28} className="object-contain w-full h-full" />
    </div>
    <div className="flex items-center gap-1 pt-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </motion.div>
);

// ── Main ChatView ──────────────────────────────────────────────────────────────

interface ChatViewProps {
  chatId: string;
  initialMessages: Message[];
  onMessagesChange: (messages: Message[]) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ chatId, initialMessages, onMessagesChange }) => {
  const { data: session } = useSession();
  const rawFirstName = (session?.user?.name || "entrepreneur").split(" ")[0];
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput]       = useState("");
  const [isLoading, setLoading] = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const hasMessages             = messages.length > 0;

  // Reset when switching to a different chat
  useEffect(() => {
    setMessages(initialMessages);
    setInput("");
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const detectLang = (text: string): "ne" | "en" =>
    (text.match(/[ऀ-ॿ]/g) || []).length / Math.max(text.length, 1) > 0.1 ? "ne" : "en";

  const sendMessage = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || isLoading) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: q };
      const next = [...messages, userMsg];
      setMessages(next);
      onMessagesChange(next);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch(`${API}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, language: detectLang(q) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          sources: data.sources ?? [],
        };
        const withAnswer = [...next, assistantMsg];
        setMessages(withAnswer);
        onMessagesChange(withAnswer);
      } catch (err) {
        const errMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            err instanceof Error && err.message.includes("fetch")
              ? "⚠️ Could not reach the server. Make sure the backend is running."
              : `⚠️ ${err instanceof Error ? err.message : "Unexpected error. Please try again."}`,
        };
        const withErr = [...next, errMsg];
        setMessages(withErr);
        onMessagesChange(withErr);
      } finally {
        setLoading(false);
      }
    },
    [isLoading, messages, onMessagesChange]
  );

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {/* Reading area fades to dark when chatting; the full-screen
          custom background (in page.tsx) shows through otherwise */}
      <div
        className="absolute inset-0 pointer-events-none bg-[#0a0a0a] transition-opacity duration-700"
        style={{ opacity: hasMessages ? 1 : 0 }}
      />

      {/* Glowing landing-page background — two distinct aura blobs that roam
          the screen on independent paths for a random-looking motion. The
          outer div fades the whole thing out once a conversation starts. */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700"
        style={{ opacity: hasMessages ? 0 : 1 }}
      >
        {/* Blob A — tall purple shape, lives on the LEFT side */}
        <div
          className="absolute left-[2%] top-[28%] h-[55vh] w-[38vw] rounded-full animate-[auraFloatA_19s_ease-in-out_infinite]"
          style={{
            filter: "blur(70px)",
            background:
              "radial-gradient(closest-side, rgba(140,95,250,0.55) 0%, rgba(120,90,240,0.22) 55%, transparent 100%)",
          }}
        />
        {/* Blob B — wide blue shape, lives on the RIGHT side */}
        <div
          className="absolute left-[56%] top-[40%] h-[42vh] w-[48vw] rounded-full animate-[auraFloatB_26s_ease-in-out_infinite]"
          style={{
            filter: "blur(80px)",
            background:
              "radial-gradient(closest-side, rgba(70,115,245,0.50) 0%, rgba(60,100,230,0.20) 55%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="empty"
              className="flex-1 flex flex-col items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
            >
              <div className="w-full max-w-[720px] mx-auto flex flex-col items-center text-center gap-8">
                <h1 className="text-5xl sm:text-6xl font-medium tracking-tight bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
                  Hello, {firstName}!
                </h1>

                <div className="w-full max-w-[680px] mx-auto">
                  <InputBox
                    value={input}
                    onChange={setInput}
                    onSend={() => sendMessage(input)}
                    isLoading={isLoading}
                    dark={true}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              className="flex flex-col flex-1 min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6">
                <div className="max-w-2xl mx-auto flex flex-col gap-6">
                  {messages.map((msg, i) =>
                    msg.role === "user" ? (
                      <UserMessage key={msg.id} msg={msg} />
                    ) : (
                      <AssistantMessage
                        key={msg.id}
                        msg={msg}
                        question={messages[i - 1]?.content ?? ""}
                      />
                    )
                  )}
                  {isLoading && <ThinkingDots />}
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="flex-shrink-0 px-4 pb-5 pt-2 border-t border-white/5">
                <div className="max-w-2xl mx-auto flex flex-col gap-2">
                  <InputBox
                    value={input}
                    onChange={setInput}
                    onSend={() => sendMessage(input)}
                    isLoading={isLoading}
                    dark={true}
                  />
                  <p className="text-center text-white/18 text-[10px]">
                    Your AI cofounder · Brainstorm, strategize, and build together
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
