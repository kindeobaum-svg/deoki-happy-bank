/** 로그아웃 시 클라이언트 저장소 초기화 비활성 — 반/원아/통장은 DB 전용 */
export const APP_LOCAL_STORAGE_KEYS = [] as const;

export function clearAppClientStorage() {
  // no-op: DB 데이터는 건드리지 않음
}
