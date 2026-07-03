import type { InviteTargetRole } from "@prisma/client";

/** trim + 대문자 + 공백 제거 (하이픈 유지) */
export function normalizeInviteCodeInput(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** 하이픈·공백 무시 비교용 */
export function compactInviteCode(code: string): string {
  return normalizeInviteCodeInput(code).replace(/-/g, "");
}

export function inviteCodesMatch(stored: string, input: string): boolean {
  return compactInviteCode(stored) === compactInviteCode(input);
}

export function formatInviteCode(code: string): string {
  return normalizeInviteCodeInput(code);
}

export function canCreateInvite(
  role: "TEACHER" | "DIRECTOR",
  targetRole: InviteTargetRole,
): boolean {
  if (targetRole === "TEACHER") {
    return role === "DIRECTOR";
  }
  return role === "TEACHER" || role === "DIRECTOR";
}
