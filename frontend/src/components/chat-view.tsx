"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Rocket, ArrowUp, Square, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import type { Message } from "@/lib/chat-store";

const API = "https://web-production-27a7b.up.railway.app";

const SUGGESTIONS = [
  "Help me validate my startup idea",
  "Draft a go-to-market strategy for my product",
  "What should my MVP include?",
  "How do I pitch this to investors?",
];

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

const AssistantMessage: React.FC<{ msg: Message }> = ({ msg }) => {
  const copy = () => navigator.clipboard.writeText(msg.content).catch(() => {});
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 group"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
        <Rocket className="w-3.5 h-3.5 text-white" />
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
          {[
            { icon: <Copy className="w-3.5 h-3.5" />, label: "Copy", fn: copy },
            { icon: <ThumbsUp className="w-3.5 h-3.5" />, label: "Good", fn: () => {} },
            { icon: <ThumbsDown className="w-3.5 h-3.5" />, label: "Bad", fn: () => {} },
          ].map((b) => (
            <button
              key={b.label}
              title={b.label}
              onClick={b.fn}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/65 hover:bg-white/8 transition-colors"
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ThinkingDots: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
      <Rocket className="w-3.5 h-3.5 text-white" />
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

      <div className="relative z-10 flex flex-col h-full">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="empty"
              className="flex-1 flex flex-col items-center justify-center px-4 pb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
            >
              <div className="w-full max-w-[560px] flex flex-col items-center gap-7">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-sm border border-black/10 flex items-center justify-center shadow-xl">
                    <Rocket className="w-7 h-7 text-white drop-shadow" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-white text-2xl font-semibold tracking-tight">
                      How can I help you?
                    </h1>
                    <p className="text-white/55 text-sm mt-1">
                      Your AI cofounder for building startups
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  <InputBox
                    value={input}
                    onChange={setInput}
                    onSend={() => sendMessage(input)}
                    isLoading={isLoading}
                    dark={false}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  {SUGGESTIONS.map((s) => (
                    <LiquidButton
                      key={s}
                      onClick={() => sendMessage(s)}
                      size="default"
                      className="block w-full h-auto rounded-xl px-3.5 py-3 text-left whitespace-normal text-white/70 hover:text-white text-xs font-normal leading-relaxed"
                    >
                      {s}
                    </LiquidButton>
                  ))}
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
                  {messages.map((msg) =>
                    msg.role === "user" ? (
                      <UserMessage key={msg.id} msg={msg} />
                    ) : (
                      <AssistantMessage key={msg.id} msg={msg} />
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
