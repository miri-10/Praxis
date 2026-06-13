"use client";

import React, { useState } from "react";
import { X, Loader2, FolderPlus } from "lucide-react";
import { createProject, generateTodos } from "@/lib/api";

const GRANT_TYPES = [
  { value: "iedi_startup_loan", label: "IEDI Startup Loan 2082" },
  { value: "ysef_youth_fund",   label: "YSEF Youth Fund" },
  { value: "nrb_refinancing",   label: "NRB Refinancing" },
  { value: "general",           label: "General / Other" },
];

interface NewProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onCreated }) => {
  const [name, setName]           = useState("");
  const [grantType, setGrantType] = useState("general");
  const [website, setWebsite]     = useState("");
  const [description, setDesc]    = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [step, setStep]           = useState<"idle" | "creating" | "generating">("idle");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Project name is required."); return; }
    setError("");
    setLoading(true);

    try {
      setStep("creating");
      const project = await createProject({
        name:        name.trim(),
        grant_type:  grantType,
        website:     website.trim() || null,
        description: description.trim() || null,
      });

      setStep("generating");
      await generateTodos(project.id).catch(() => null); // non-fatal if it fails

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = step === "creating" ? "Creating project…" : step === "generating" ? "Generating checklist…" : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={!loading ? onClose : undefined} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-md border border-white/10 bg-[#1c1d21] shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">New Project</h2>
              <p className="text-white/40 text-xs">Start a grant application</p>
            </div>
          </div>
          {!loading && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          {/* Project Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Project Name <span className="text-violet-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IEDI Application 2082"
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-400/60 focus:bg-white/10 disabled:opacity-50 transition-all"
            />
          </div>

          {/* Grant Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Grant Type
            </label>
            <select
              value={grantType}
              onChange={(e) => setGrantType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm focus:outline-none focus:border-violet-400/60 disabled:opacity-50 transition-all appearance-none cursor-pointer"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff60' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px" }}
            >
              {GRANT_TYPES.map((g) => (
                <option key={g.value} value={g.value} style={{ background: "#1a1a1a" }}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Company Website */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Company Website <span className="text-white/30">(optional)</span>
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-400/60 focus:bg-white/10 disabled:opacity-50 transition-all"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Description <span className="text-white/30">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief notes about this application…"
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-400/60 disabled:opacity-50 resize-none transition-all"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Loading step label */}
        {loading && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            <span>{stepLabel}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/8 disabled:opacity-40 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold hover:from-purple-400 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
};
