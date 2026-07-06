/** @deprecated localStorage 기반 반 관리는 제거됨. DB ClassRoom + /api/classes 사용 */
export type TeacherClass = {
  id: string;
  name: string;
};

/** DB 반 목록과 원아 반 이름을 합쳐 표시 (하위 호환) */
export function mergeClassesWithChildren(
  stored: TeacherClass[],
  childClassNames: string[],
): TeacherClass[] {
  const byName = new Map<string, TeacherClass>();
  for (const cls of stored) {
    byName.set(cls.name, cls);
  }
  for (const name of childClassNames) {
    const trimmed = name.trim();
    if (!trimmed || byName.has(trimmed)) continue;
    byName.set(trimmed, {
      id: `cls-db-${trimmed}`,
      name: trimmed,
    });
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}
