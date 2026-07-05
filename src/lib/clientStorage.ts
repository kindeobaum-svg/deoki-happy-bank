/** 앱 클라이언트 저장소 키 — 로그아웃 시 전부 삭제 */
export const APP_LOCAL_STORAGE_KEYS = [
  "haengbok-local-passbook",
  "haengbok-teacher-classes",
  "haengbok-mission-completions",
] as const;

export function clearAppClientStorage() {
  if (typeof window === "undefined") return;
  for (const key of APP_LOCAL_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  sessionStorage.clear();
}
