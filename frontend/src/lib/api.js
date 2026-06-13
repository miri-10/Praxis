const BASE = "http://localhost:8000";

async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...(options.headers || {}) }
    : { "Content-Type": "application/json", ...(options.headers || {}) };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Projects ──────────────────────────────────────────────────────────────────
export const createProject  = (data)    => apiFetch("/projects",        { method: "POST",   body: JSON.stringify(data) });
export const listProjects   = ()        => apiFetch("/projects");
export const getProject     = (id)      => apiFetch(`/projects/${id}`);
export const updateProject  = (id, data)=> apiFetch(`/projects/${id}`,  { method: "PATCH",  body: JSON.stringify(data) });
export const deleteProject  = (id)      => apiFetch(`/projects/${id}`,  { method: "DELETE" });

// ── Todos ─────────────────────────────────────────────────────────────────────
export const generateTodos  = (id)           => apiFetch(`/projects/${id}/todos/generate`, { method: "POST" });
export const getTodos       = (id)           => apiFetch(`/projects/${id}/todos`);
export const createTodo     = (id, data)     => apiFetch(`/projects/${id}/todos`,           { method: "POST",   body: JSON.stringify(data) });
export const updateTodo     = (id, tid, data)=> apiFetch(`/projects/${id}/todos/${tid}`,    { method: "PATCH",  body: JSON.stringify(data) });
export const deleteTodo     = (id, tid)      => apiFetch(`/projects/${id}/todos/${tid}`,    { method: "DELETE" });

// ── Saved Chats ───────────────────────────────────────────────────────────────
export const getSavedChats  = (id)           => apiFetch(`/projects/${id}/chats`);
export const saveChat       = (id, data)     => apiFetch(`/projects/${id}/chats`,           { method: "POST",   body: JSON.stringify(data) });
export const deleteChat     = (id, cid)      => apiFetch(`/projects/${id}/chats/${cid}`,    { method: "DELETE" });

// ── Files ─────────────────────────────────────────────────────────────────────
export const listFiles      = (id)           => apiFetch(`/projects/${id}/files`);
export const uploadFile     = (id, formData) => apiFetch(`/projects/${id}/files`,           { method: "POST",   body: formData });
export const deleteFile     = (id, fid)      => apiFetch(`/projects/${id}/files/${fid}`,    { method: "DELETE" });

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications  = ()    => apiFetch("/notifications");
export const getUnreadCount    = ()    => apiFetch("/notifications/unread-count");
export const markNotificationRead = (id) => apiFetch(`/notifications/${id}`, { method: "PATCH", body: JSON.stringify({ is_read: true }) });
