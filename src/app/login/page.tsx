"use client";

import { PassbookShell } from "@/components/passbook/PassbookShell";
import { QuickRoleEnter } from "@/components/QuickRoleEnter";
import { SHOWCASE_CHILD_NAME } from "@/lib/demoAccess";
import { PASSBOOK_NAME } from "@/lib/branding";

const roleEntries = [
  {
    role: "PARENT" as const,
    emoji: "💚",
    title: "학부모 통장",
    desc: `${SHOWCASE_CHILD_NAME}의 ${PASSBOOK_NAME} 바로 열기`,
    primary: true,
  },
  {
    role: "TEACHER" as const,
    emoji: "👩‍🏫",
    title: "선생님",
    desc: "30초 칭찬 · 통장 입금",
  },
  {
    role: "DIRECTOR" as const,
    emoji: "🏫",
    title: "원장님",
    desc: "어린이집 전체 현황 보기",
  },
  {
    role: "CHILD" as const,
    emoji: "🌱",
    title: "원아",
    desc: "행복 나무 키우기",
  },
];

export default function LoginHubPage() {
  return (
    <div className="space-y-5 pt-2 pb-6">
      <PassbookShell open={false} tagline="작은 습관 · 큰 행복" />

      <p className="text-center text-sm leading-relaxed text-[var(--ink-soft)]">
        버튼을 누르면 바로 입장해요
        <br />
        <span className="text-xs opacity-80">아이디 · 비밀번호 입력 없이</span>
      </p>

      <section className="space-y-2.5">
        {roleEntries.map((entry) => (
          <QuickRoleEnter key={entry.role} {...entry} />
        ))}
      </section>
    </div>
  );
}
