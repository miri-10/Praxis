"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar }       from "@/components/sidebar";
import { ChatView }      from "@/components/chat-view";
import { ProjectsPage }  from "@/components/ProjectsPage";
import { ProjectDetail } from "@/components/ProjectDetail";
import { loadChats, persistChats, newChat, type Chat, type Message } from "@/lib/chat-store";

export default function Home() {
  const [section,     setSection]     = useState("chat");
  const [collapsed,   setCollapsed]   = useState(false);
  const [projectId,   setProjectId]   = useState<string | null>(null);

  // ── Multi-chat state ─────────────────────────────────────────────────────────
  const [chats,        setChats]        = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");

  useEffect(() => {
    const stored = loadChats();
    if (stored.length > 0) {
      setChats(stored);
      setActiveChatId(stored[0].id);
    } else {
      const first = newChat();
      setChats([first]);
      setActiveChatId(first.id);
      persistChats([first]);
    }
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const handleNewChat = useCallback(() => {
    const chat = newChat();
    setChats((prev) => {
      const updated = [chat, ...prev];
      persistChats(updated);
      return updated;
    });
    setActiveChatId(chat.id);
    setSection("chat");
  }, []);

  const handleChatSelect = useCallback((id: string) => {
    setActiveChatId(id);
    setSection("chat");
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fresh = newChat();
        persistChats([fresh]);
        setActiveChatId(fresh.id);
        return [fresh];
      }
      persistChats(filtered);
      if (id === activeChatId) setActiveChatId(filtered[0].id);
      return filtered;
    });
  }, [activeChatId]);

  const handleMessagesChange = useCallback((messages: Message[]) => {
    setChats((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const title =
          c.title === "New chat" && messages.length > 0
            ? (messages.find((m) => m.role === "user")?.content.slice(0, 45) ?? "New chat")
            : c.title;
        return { ...c, title, messages, updatedAt: Date.now() };
      });
      persistChats(updated);
      return updated;
    });
  }, [activeChatId]);

  const handleSection = (s: string) => {
    setSection(s);
    if (s !== "projects") setProjectId(null);
  };

  const mainView = () => {
    if (section === "projects") {
      return projectId
        ? <ProjectDetail projectId={projectId} onBack={() => setProjectId(null)} />
        : <ProjectsPage onSelectProject={setProjectId} />;
    }
    if (activeChat) {
      return (
        <ChatView
          key={activeChatId}
          chatId={activeChatId}
          initialMessages={activeChat.messages}
          onMessagesChange={handleMessagesChange}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      <Sidebar
        activeSection={section}
        onSectionChange={handleSection}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        chats={chats}
        activeChatId={activeChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      {mainView()}
    </div>
  );
}
