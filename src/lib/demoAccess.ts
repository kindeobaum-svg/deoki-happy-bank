import type { Role } from "@/lib/types";

export type DemoAccount = {
  email: string;
  password: string;
  redirect: string;
  label: string;
};

/** 체험·데모용 바로 입장 계정 (비밀번호 입력 없음) */
export const DEMO_ACCOUNTS: Record<Role, DemoAccount> = {
  PARENT: {
    email: "parent@haengbok.local",
    password: "1234",
    redirect: "/passbook",
    label: "김하늘",
  },
  TEACHER: {
    email: "teacher@haengbok.local",
    password: "1234",
    redirect: "/teacher",
    label: "담임 선생님",
  },
  DIRECTOR: {
    email: "director@haengbok.local",
    password: "1234",
    redirect: "/admin",
    label: "원장 선생님",
  },
  CHILD: {
    email: "child@haengbok.local",
    password: "1234",
    redirect: "/child",
    label: "김하늘",
  },
};

export const SHOWCASE_CHILD_NAME = DEMO_ACCOUNTS.PARENT.label;

export function getDemoAccount(role: Role): DemoAccount {
  return DEMO_ACCOUNTS[role];
}
