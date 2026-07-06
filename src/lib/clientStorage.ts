/** 앱 클라이언트 저장소 키 — 로그아웃 시 UI 전용 데이터만 삭제 (통장/미션은 DB 저장) */
export const APP_LOCAL_STORAGE_KEYS = [
  "haengbok-teacher-classes",
] as const;

export function clearAppClientStorage() {
  if (typeof window === "undefined") return;
  for (const key of APP_LOCAL_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  sessionStorage.clear();
}
