"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Upload, Trash2, FileText, Image, Loader2, X } from "lucide-react";
import { uploadFile, listFiles, deleteFile } from "@/lib/api";

const ACCEPT = ["application/pdf", "image/jpeg", "image/png"];
const MAX_MB = 5;

interface ProjectFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

interface FileUploadProps {
  projectId: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const FileUpload: React.FC<FileUploadProps> = ({ projectId }) => {
  const [files, setFiles]       = useState<ProjectFile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError]       = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await listFiles(projectId);
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const processFile = async (file: File) => {
    setError("");
    if (!ACCEPT.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are allowed.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploaded = await uploadFile(projectId, fd);
      setFiles((prev) => [uploaded, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [projectId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteFile(projectId, id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch { /* ignore */ }
  };

  const fileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="w-4 h-4 text-red-400" />;
    return <Image className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-orange-400/60 bg-orange-400/8"
            : "border-white/15 bg-white/4 hover:border-white/25 hover:bg-white/6"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); e.target.value = ""; }}
        />
        {uploading ? (
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        ) : (
          <Upload className={`w-8 h-8 transition-colors ${dragOver ? "text-orange-400" : "text-white/30"}`} />
        )}
        <div className="text-center">
          <p className="text-white/70 text-sm font-medium">
            {uploading ? "Uploading…" : dragOver ? "Drop to upload" : "Drag & drop or click to browse"}
          </p>
          <p className="text-white/30 text-xs mt-0.5">PDF, JPG, PNG — max {MAX_MB} MB</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-400/10 border border-red-400/20">
          <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-xs flex-1">{error}</p>
          <button onClick={() => setError("")} className="text-red-400/60 hover:text-red-400">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-6">No files uploaded yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {files.map((f) => (
            <div
              key={f.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:border-white/15 transition-all"
            >
              <div className="flex-shrink-0">{fileIcon(f.file_name)}</div>
              <div className="flex-1 min-w-0">
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/85 text-sm font-medium truncate block hover:text-white transition-colors"
                >
                  {f.file_name}
                </a>
                <p className="text-white/35 text-xs">
                  {formatBytes(f.file_size)} · {formatDate(f.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                className="flex-shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
