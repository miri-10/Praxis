export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const KEY = "praxis_chats";

export const loadChats = (): Chat[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const persistChats = (chats: Chat[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(chats));
};

export const newChat = (): Chat => ({
  id: crypto.randomUUID(),
  title: "New chat",
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
