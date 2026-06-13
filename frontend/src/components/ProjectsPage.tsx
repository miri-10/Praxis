"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Folder, Loader2, CalendarDays, CheckSquare } from "lucide-react";
import { listProjects, getTodos } from "@/lib/api";
import { NewProjectModal } from "@/components/NewProjectModal";

const GRANT_LABELS: Record<string, string> = {
  iedi_startup_loan: "IEDI Startup Loan",
  ysef_youth_fund:   "YSEF Youth Fund",
  nrb_refinancing:   "NRB Refinancing",
  general:           "General / Other",
};

const GRANT_COLORS: Record<string, string> = {
  iedi_startup_loan: "bg-blue-500/15 text-blue-300 border-blue-400/20",
  ysef_youth_fund:   "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  nrb_refinancing:   "bg-violet-500/15 text-violet-300 border-violet-400/20",
  general:           "bg-white/8 text-white/55 border-white/12",
};

const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-amber-400/12 text-amber-300 border-amber-400/20",
  submitted:   "bg-blue-400/12 text-blue-300 border-blue-400/20",
  approved:    "bg-emerald-400/12 text-emerald-300 border-emerald-400/20",
  rejected:    "bg-red-400/12 text-red-300 border-red-400/20",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "In Progress",
  submitted:   "Submitted",
  approved:    "Approved",
  rejected:    "Rejected",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
    <div className="rounded-2xl border border-white/8 bg-white/4 p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-white/8 rounded-full w-24" />
        <div className="h-5 bg-white/8 rounded-full w-20" />
      </div>
      <div className="h-3 bg-white/6 rounded w-1/2 mt-auto" />
    </div>
  );
}

interface ProjectsPageProps {
  onSelectProject: (id: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onSelectProject }) => {
  const [projects, setProjects]   = useState<ProjectWithProgress[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const raw: Project[] = await listProjects();
      const list = Array.isArray(raw) ? raw : [];

      // Fetch todo progress for each project in parallel
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

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#16171a] flex-shrink-0">
        <div>
          <h1 className="text-white font-semibold text-base">My Projects</h1>
          <p className="text-white/40 text-xs">{projects.length} grant application{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white text-sm font-semibold transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-5 py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
              <Folder className="w-7 h-7 text-white/30" />
            </div>
            <div className="text-center">
              <p className="text-white/70 font-semibold text-base">No projects yet</p>
              <p className="text-white/35 text-sm mt-1">Track your grant applications in one place.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white text-sm font-semibold transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Start your first grant application
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const grantColor  = GRANT_COLORS[p.grant_type]  ?? GRANT_COLORS.general;
              const statusColor = STATUS_COLORS[p.status]     ?? STATUS_COLORS.in_progress;
              const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="group text-left rounded-2xl border border-white/10 bg-white/4 hover:bg-white/7 hover:border-white/20 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 active:scale-[0.99]"
                >
                  {/* Name */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-semibold text-sm leading-snug flex-1">{p.name}</h3>
                  </div>

                  {/* Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${grantColor}`}>
                      {GRANT_LABELS[p.grant_type] ?? p.grant_type}
                    </span>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </div>

                  {/* Progress */}
                  {p.total > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-white/45 text-xs">
                          <CheckSquare className="w-3 h-3" />
                          <span>{p.completed}/{p.total} docs</span>
                        </div>
                        <span className="text-white/30 text-xs">{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-white/30 text-xs mt-auto pt-1">
                    <CalendarDays className="w-3 h-3" />
                    <span>{formatDate(p.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={fetchProjects}
        />
      )}
    </div>
  );
};
