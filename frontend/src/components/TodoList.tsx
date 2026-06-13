"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Loader2, CheckSquare, Square } from "lucide-react";
import { getTodos, createTodo, updateTodo, deleteTodo } from "@/lib/api";

interface Todo {
  id: string;
  task_text: string;
  is_completed: boolean;
  due_date: string | null;
}

interface TodoListProps {
  projectId: string;
}

export const TodoList: React.FC<TodoListProps> = ({ projectId }) => {
  const [todos, setTodos]       = useState<Todo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [newTask, setNewTask]   = useState("");
  const [adding, setAdding]     = useState(false);
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [togglingId, setToggling] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      const data = await getTodos(projectId);
      setTodos(Array.isArray(data) ? data : []);
    } catch {
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const toggleTodo = async (todo: Todo) => {
    setToggling(todo.id);
    try {
      await updateTodo(projectId, todo.id, { is_completed: !todo.is_completed });
      setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t));
    } finally {
      setToggling(null);
    }
  };

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const created = await createTodo(projectId, { task_text: newTask.trim(), due_date: null });
      setTodos((prev) => [...prev, created]);
      setNewTask("");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(projectId, id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch { /* ignore */ }
  };

  const completed = todos.filter((t) => t.is_completed).length;
  const total     = todos.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      {total > 0 && (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">
              {completed} / {total} documents collected
            </span>
            <span className="text-white/40 text-sm">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Todo list */}
      <div className="flex flex-col gap-1">
        {todos.length === 0 && (
          <p className="text-white/30 text-sm text-center py-8">
            No checklist items yet. Generate them from the project, or add manually below.
          </p>
        )}
        {todos.map((todo) => (
          <div
            key={todo.id}
            onMouseEnter={() => setHovered(todo.id)}
            onMouseLeave={() => setHovered(null)}
            className="group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <button
              onClick={() => toggleTodo(todo)}
              disabled={togglingId === todo.id}
              className="flex-shrink-0 mt-0.5 text-white/40 hover:text-violet-400 transition-colors disabled:opacity-50"
            >
              {togglingId === todo.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : todo.is_completed ? (
                <CheckSquare className="w-4 h-4 text-violet-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <span className={`flex-1 text-sm leading-relaxed transition-colors ${todo.is_completed ? "line-through text-white/30" : "text-white/80"}`}>
              {todo.task_text}
            </span>
            <button
              onClick={() => handleDelete(todo.id)}
              className={`flex-shrink-0 p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all ${hoveredId === todo.id ? "opacity-100" : "opacity-0"}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add manual todo */}
      <div className="flex gap-2 pt-2 border-t border-white/8">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a document or task…"
          className="flex-1 px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newTask.trim()}
          className="px-3 py-2 rounded-xl bg-[#16131f] hover:bg-[#1e1a2e] border border-violet-500/[0.18] hover:border-violet-400/30 text-white/55 hover:text-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
