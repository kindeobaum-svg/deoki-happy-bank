export type TeacherClass = {
  id: string;
  name: string;
};

const STORAGE_KEY = "haengbok-teacher-classes";

export function loadTeacherClasses(): TeacherClass[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TeacherClass[];
  } catch {
    return [];
  }
}

export function saveTeacherClasses(classes: TeacherClass[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  window.dispatchEvent(new Event("teacher-classes-updated"));
}

export function addTeacherClass(name: string): TeacherClass | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = loadTeacherClasses();
  if (existing.some((c) => c.name === trimmed)) return null;
  const entry: TeacherClass = {
    id: `cls-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
  };
  saveTeacherClasses([...existing, entry]);
  return entry;
}

export function updateTeacherClass(id: string, name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const existing = loadTeacherClasses();
  if (existing.some((c) => c.id !== id && c.name === trimmed)) return false;
  saveTeacherClasses(
    existing.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
  );
  return true;
}

export function deleteTeacherClass(id: string): boolean {
  const existing = loadTeacherClasses();
  saveTeacherClasses(existing.filter((c) => c.id !== id));
  return true;
}

export function findClassName(classes: TeacherClass[], classId: string): string {
  return classes.find((c) => c.id === classId)?.name ?? "";
}

export function bootstrapClassesFromChildren(classNames: string[]) {
  if (loadTeacherClasses().length > 0) return;
  const unique = [...new Set(classNames.filter(Boolean))];
  if (unique.length === 0) return;
  saveTeacherClasses(
    unique.map((name) => ({
      id: `cls-${name}-${Math.random().toString(36).slice(2, 6)}`,
      name,
    })),
  );
}
