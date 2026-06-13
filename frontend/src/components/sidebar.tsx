"use client";

import React from "react";
import {
  MessageSquare, FolderOpen, Award, Bookmark,
  Bell, Plus, Search, PanelLeftClose, PanelLeft, Scale,
  Trash2, LogIn, LogOut,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import type { Chat } from "@/lib/chat-store";

const cn = (...cls: (string | undefined | null | false)[]) => cls.filter(Boolean).join(" ");

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, badge, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group",
      active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/85"
    )}
  >
    <span className={cn("flex-shrink-0", active ? "text-white" : "text-white/45 group-hover:text-white/75")}>
      {icon}
    </span>
    <span className="flex-1 text-left truncate">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="flex-shrink-0 bg-orange-500/80 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
        {badge}
      </span>
    )}
  </button>
);

interface SidebarProps {
  activeSection: string;
  onSectionChange: (s: string) => void;
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  chats: Chat[];
  activeChatId: string;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection, onSectionChange, collapsed, onCollapse,
  chats, activeChatId, onChatSelect, onNewChat, onDeleteChat,
}) => {
  const { data: session } = useSession();

  const navItems = [
    { id: "chat",          label: "Legal Chat",   icon: <MessageSquare className="w-4 h-4" /> },
    { id: "projects",      label: "Projects",      icon: <FolderOpen    className="w-4 h-4" /> },
    { id: "grants",        label: "Grants",        icon: <Award         className="w-4 h-4" /> },
    { id: "saved",         label: "Saved Chats",   icon: <Bookmark      className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell          className="w-4 h-4" />, badge: 0 },
  ];

  const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  const userName  = session?.user?.name  || "Guest";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || null;
  const initials  = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-white/8 bg-black/50 backdrop-blur-2xl transition-all duration-300 flex-shrink-0",
        collapsed ? "w-[60px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/8 flex-shrink-0">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-white font-semibold text-sm tracking-wide">Praxis</p>
                <p className="text-white/35 text-[10px]">Nepal Legal AI</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/8 transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button onClick={() => onCollapse(true)} className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/8 transition-colors">
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mx-auto">
            <Scale className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => onCollapse(false)}
          className="mx-auto mt-3 p-2 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/8 transition-colors flex-shrink-0"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* New Chat */}
      <div className={cn("px-2 pt-3 flex-shrink-0", collapsed && "flex justify-center")}>
        <button
          onClick={onNewChat}
          className={cn(
            "flex items-center gap-2.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/18 text-white text-sm font-medium transition-all active:scale-[0.98]",
            collapsed ? "p-2" : "w-full px-3 py-2"
          )}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2 pt-4 flex flex-col gap-0.5 flex-shrink-0">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-1">
            Main
          </p>
        )}
        {collapsed ? (
          <div className="flex flex-col gap-0.5 items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "relative p-2 rounded-xl transition-colors",
                  activeSection === item.id
                    ? "bg-white/15 text-white"
                    : "text-white/45 hover:bg-white/8 hover:text-white/75"
                )}
              >
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        ) : (
          navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.id}
              badge={item.badge}
              onClick={() => onSectionChange(item.id)}
            />
          ))
        )}
      </nav>

      {/* Recent Chats — scrollable, fills remaining space */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto min-h-0 px-2 pt-4">
          {sortedChats.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-1">
                Recent Chats
              </p>
              <div className="flex flex-col gap-0.5">
                {sortedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150",
                      activeChatId === chat.id && activeSection === "chat"
                        ? "bg-white/15"
                        : "hover:bg-white/8"
                    )}
                    onClick={() => {
                      onChatSelect(chat.id);
                      onSectionChange("chat");
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate leading-snug",
                        activeChatId === chat.id && activeSection === "chat"
                          ? "text-white"
                          : "text-white/60"
                      )}>
                        {chat.title}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">{relativeTime(chat.updatedAt)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/25 hover:text-red-400 hover:bg-white/8 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {collapsed && <div className="flex-1" />}

      {/* User profile */}
      <div className={cn("border-t border-white/8 p-2 flex-shrink-0", collapsed && "flex justify-center")}>
        {session ? (
          <div className={cn("flex items-center gap-3 rounded-xl group", collapsed ? "p-2 justify-center" : "px-3 py-2")}>
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt={userName} className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            )}
            {!collapsed && (
              <>
                <div className="flex-1 text-left leading-tight min-w-0">
                  <p className="text-white text-sm font-medium truncate">{userName}</p>
                  <p className="text-white/35 text-[10px] truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className={cn(
              "flex items-center gap-3 rounded-xl hover:bg-white/8 transition-colors text-white/45 hover:text-white/80",
              collapsed ? "p-2 justify-center" : "w-full px-3 py-2"
            )}
          >
            <LogIn className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign in with Google</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
