export interface GlobalSave {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  savedAt: number;
}

const KEY = "praxis_saved_responses";

export const loadSaves = (): GlobalSave[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); }
  catch { return []; }
};

export const addSave = (save: Omit<GlobalSave, "id" | "savedAt">): void => {
  const saves = loadSaves();
  saves.unshift({ ...save, id: crypto.randomUUID(), savedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(saves.slice(0, 200)));
};

export const removeSave = (id: string): void => {
  const saves = loadSaves().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(saves));
};
