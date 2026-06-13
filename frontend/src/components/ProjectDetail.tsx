"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2, CheckSquare, MessageSquare, Paperclip } from "lucide-react";
import { getProject, updateProject } from "@/lib/api";
import { TodoList } from "@/components/TodoList";
import { SavedChats } from "@/components/SavedChats";
import { FileUpload } from "@/components/FileUpload";

const GRANT_LABELS: Record<string, string> = {
  iedi_startup_loan: "IEDI Startup Loan 2082",
  ysef_youth_fund:   "YSEF Youth Fund",
  nrb_refinancing:   "NRB Refinancing",
  general:           "General / Other",
};

const GRANT_COLORS: Record<string, string> = {
  iedi_startup_loan: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  ysef_youth_fund:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  nrb_refinancing:   "bg-violet-500/15 text-violet-300 border-violet-500/20",
  general:           "bg-white/10 text-white/60 border-white/15",
};

const STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress",  color: "text-amber-400" },
  { value: "submitted",   label: "Submitted",     color: "text-blue-400" },
  { value: "approved",    label: "Approved",      color: "text-emerald-400" },
  { value: "rejected",    label: "Rejected",      color: "text-red-400" },
];

type TabId = "checklist" | "saved" | "files";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "checklist", label: "Checklist",    icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { id: "saved",     label: "Saved Chats",  icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: "files",     label: "Files",        icon: <Paperclip className="w-3.5 h-3.5" /> },
];

interface Project {
  id: string;
  name: string;
  grant_type: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab]   = useState<TabId>("checklist");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    getProject(projectId)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return;
    setUpdatingStatus(true);
    try {
      await updateProject(projectId, { status: newStatus });
      setProject((p) => p ? { ...p, status: newStatus } : p);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-white/50">Project not found.</p>
        <button onClick={onBack} className="text-violet-400 text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const grantColor = GRANT_COLORS[project.grant_type] ?? GRANT_COLORS.general;
  const statusObj  = STATUS_OPTIONS.find((s) => s.value === project.status) ?? STATUS_OPTIONS[0];

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex-shrink-0 border-b border-white/10 bg-[#16171a]">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Projects</span>
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white/80 text-sm font-medium truncate flex-1">{project.name}</span>
        </div>

        <div className="flex items-center gap-3 px-5 pb-4">
          <h1 className="text-white font-semibold text-lg truncate">{project.name}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${grantColor}`}>
            {GRANT_LABELS[project.grant_type] ?? project.grant_type}
          </span>

          {/* Status dropdown */}
          <div className="relative ml-auto flex-shrink-0">
            {updatingStatus && <Loader2 className="w-3.5 h-3.5 text-white/40 animate-spin absolute -left-5 top-1/2 -translate-y-1/2" />}
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className={`appearance-none px-3 py-1.5 rounded-xl bg-white/8 border border-white/12 text-sm font-medium focus:outline-none focus:border-violet-400/50 disabled:opacity-50 cursor-pointer transition-all pr-7 ${statusObj.color}`}
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff50' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "14px" }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value} style={{ background: "#1a1a1a" }}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-violet-400 text-violet-400"
                  : "border-transparent text-white/45 hover:text-white/70"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {activeTab === "checklist" && <TodoList projectId={projectId} />}
          {activeTab === "saved"     && <SavedChats projectId={projectId} />}
          {activeTab === "files"     && <FileUpload projectId={projectId} />}
        </div>
      </div>
    </div>
  );
};
