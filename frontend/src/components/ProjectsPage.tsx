"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Folder, Search, ChevronDown } from "lucide-react";
import { listProjects, getTodos } from "@/lib/api";
import { NewProjectModal } from "@/components/NewProjectModal";

const GRANT_LABELS: Record<string, string> = {
  iedi_startup_loan: "IEDI Startup Loan",
  ysef_youth_fund:   "YSEF Youth Fund",
  nrb_refinancing:   "NRB Refinancing",
  general:           "General / Other",
};

const STATUS_COLORS: Record<string, string> = {
  in_progress: "text-amber-400  bg-amber-400/10  border-amber-400/20",
  submitted:   "text-blue-400   bg-blue-400/10   border-blue-400/20",
  approved:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  rejected:    "text-red-400    bg-red-400/10    border-red-400/20",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "In Progress",
  submitted:   "Submitted",
  approved:    "Approved",
  rejected:    "Rejected",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)         return "just now";
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 86_400_000 * 2) return "yesterday";
  if (diff < 86_400_000 * 7) return `${Math.floor(diff / 86_400_000)} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Project {
  id: string;
  name: string;
  grant_type: string;
  status: string;
  created_at: string;
}

interface ProjectWithProgress extends Project {
  completed: number;
  total: number;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-5 bg-white/8 rounded-md w-20 flex-shrink-0" />
      </div>
      <div className="h-3 bg-white/6 rounded w-1/3" />
      <div className="h-3 bg-white/5 rounded w-1/4 mt-auto" />
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectWithProgress;
  onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  const pct         = project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0;
  const statusColor = STATUS_COLORS[project.status] ?? STATUS_COLORS.in_progress;
  const statusLabel = STATUS_LABELS[project.status] ?? project.status;
  const grantLabel  = GRANT_LABELS[project.grant_type] ?? project.grant_type;

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] p-5 flex flex-col gap-3 transition-all duration-200 active:scale-[0.995]"
    >
      {/* Name + status badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-semibold text-base leading-snug flex-1 min-w-0 truncate">
          {project.name}
        </h3>
        <span className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Grant type */}
      <p className="text-white/35 text-xs -mt-1">{grantLabel}</p>

      {/* Progress bar */}
      {project.total > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-white/30">
            <span>{project.completed} / {project.total} docs</span>
            <span>{pct}%</span>
          </div>
          <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/40 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-white/25 text-xs mt-auto pt-1">
        Updated {relativeTime(project.created_at)}
      </p>
    </button>
  );
}

interface ProjectsPageProps {
  onSelectProject: (id: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onSelectProject }) => {
  const [projects,   setProjects]   = useState<ProjectWithProgress[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [search,     setSearch]     = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const raw: Project[] = await listProjects();
      const list = Array.isArray(raw) ? raw : [];
      const withProgress = await Promise.all(
        list.map(async (p) => {
          try {
            const todos = await getTodos(p.id);
            const arr   = Array.isArray(todos) ? todos : [];
            return { ...p, completed: arr.filter((t: { is_completed: boolean }) => t.is_completed).length, total: arr.length };
          } catch {
            return { ...p, completed: 0, total: 0 };
          }
        })
      );
      setProjects(withProgress);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      {/* ── Page header ── */}
      <div className="flex-shrink-0 px-8 pt-8 pb-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white font-semibold text-2xl tracking-tight">Projects</h1>
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.12] text-white/50 text-sm hover:bg-white/5 transition-colors">
              Sort by <span className="text-white/80 font-medium">Last updated</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-white/90 text-[#0a0a0a] text-sm font-medium transition-all active:scale-95"
            >
              New project
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:outline-none text-white text-sm placeholder:text-white/30 transition-all"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-8 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-24">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
              <Folder className="w-6 h-6 text-white/25" />
            </div>
            <div className="text-center">
              <p className="text-white/70 font-semibold">No projects yet</p>
              <p className="text-white/35 text-sm mt-1">Create a project to track your grant applications.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white hover:bg-white/90 text-[#0a0a0a] text-sm font-medium transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New project
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-white/50 text-sm">No projects match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch("")} className="text-white/35 text-xs hover:text-white/60 transition-colors">
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => onSelectProject(p.id)} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={fetchProjects}
        />
      )}
    </div>
  );
};
