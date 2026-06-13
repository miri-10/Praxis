"use client";

import React from "react";
import {
  MessageSquare, FolderOpen, Award, Bookmark,
  Bell, Plus, Search, PanelLeftClose, PanelLeft, Scale,
} from "lucide-react";

const cn = (...cls: (string | undefined | null | false)[]) => cls.filter(Boolean).join(" ");

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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection, onSectionChange, collapsed, onCollapse,
}) => {
  const navItems = [
    { id: "chat",          label: "Legal Chat",     icon: <MessageSquare className="w-4 h-4" /> },
    { id: "projects",      label: "Projects",        icon: <FolderOpen    className="w-4 h-4" /> },
    { id: "grants",        label: "Grants",          icon: <Award         className="w-4 h-4" /> },
    { id: "saved",         label: "Saved Chats",     icon: <Bookmark      className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications",   icon: <Bell          className="w-4 h-4" />, badge: 0 },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-white/8 bg-black/50 backdrop-blur-2xl transition-all duration-300 flex-shrink-0",
        collapsed ? "w-[60px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/8">
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
          className="mx-auto mt-3 p-2 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/8 transition-colors"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* New Chat */}
      <div className={cn("px-2 pt-3", collapsed && "flex justify-center")}>
        <button
          onClick={() => onSectionChange("chat")}
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
      <nav className="px-2 pt-4 flex flex-col gap-0.5">
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

      {/* User profile */}
      <div className={cn("mt-auto border-t border-white/8 p-2", collapsed && "flex justify-center")}>
        <button
          className={cn(
            "flex items-center gap-3 rounded-xl hover:bg-white/8 transition-colors w-full",
            collapsed ? "p-2 justify-center" : "px-3 py-2"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          {!collapsed && (
            <div className="flex-1 text-left leading-tight min-w-0">
              <p className="text-white text-sm font-medium truncate">Misan Pokharel</p>
              <p className="text-white/35 text-[10px] truncate">Pro plan</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
