"use client";

import Link from "next/link";
import { useApp } from "@/hooks/useAppStore";
import { LogoutButton } from "@/components/LogoutButton";
import { PassbookShell } from "@/components/passbook/PassbookShell";
import { PASSBOOK_NAME } from "@/lib/branding";
import { SHOWCASE_CHILD_NAME } from "@/lib/demoAccess";

const roleLinks = [
  {
    href: "/login/parent",
    emoji: "📒",
    title: `${SHOWCASE_CHILD_NAME} ${PASSBOOK_NAME}`,
    desc: "학부모 · 통장 보기",
    primary: true,
  },
  {
    href: "/login/teacher",
    emoji: "👩‍🏫",
    title: "선생님",
    desc: "교사 모드 입장",
  },
  {
    href: "/login/director",
    emoji: "🏫",
    title: "원장님",
    desc: "원장 관리 입장",
  },
  {
    href: "/login/child",
    emoji: "🌱",
    title: "원아",
    desc: "원아 모드 입장",
  },
];

export default function HomePage() {
  const { state } = useApp();
  const user = state.user;

  if (!user) {
    return (
      <div className="space-y-6 pt-2">
        <PassbookShell open={false} tagline="우리 아이의 하루를 따뜻하게 함께해요" />

        <p className="text-center text-sm leading-relaxed text-[var(--ink-soft)]">
          역할을 선택한 뒤 입장해 주세요
        </p>

        <div className="mx-auto max-w-sm space-y-2.5 px-1">
          {roleLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`passbook-role-card tap-scale block w-full text-left ${item.primary ? "passbook-role-card-primary" : ""}`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-[var(--sage-800)]">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-soft)]">{item.desc}</p>
              </div>
              <span className="text-[var(--sage-400)]" aria-hidden>
                →
              </span>
            </Link>
          ))}

          <p className="pt-1 text-center">
            <Link href="/login" className="text-xs font-semibold text-[var(--sage-600)]">
              전체 메뉴 보기 →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const links = [
    { href: "/admin", emoji: "🏫", title: "원장 관리", roles: ["DIRECTOR"] },
    { href: "/teacher#classes", emoji: "🏫", title: "반 관리", roles: ["DIRECTOR"] },
    { href: "/teacher", emoji: "👩‍🏫", title: "교사 모드", roles: ["TEACHER"] },
    { href: "/passbook", emoji: "📒", title: PASSBOOK_NAME, roles: ["PARENT"] },
    { href: "/child", emoji: "🌱", title: "원아 모드", roles: ["CHILD", "TEACHER"] },
  ].filter((l) => l.roles.includes(user.role));

  return (
    <div className="space-y-5">
      <PassbookShell open={false} tagline={`${user.name}님, 반가워요`} />
      <section className="space-y-2.5">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="passbook-role-card">
            <span className="text-2xl">{item.emoji}</span>
            <p className="font-display font-bold text-[var(--sage-800)]">{item.title}</p>
          </Link>
        ))}
      </section>
      <div className="px-1 pt-2">
        <LogoutButton className="w-full rounded-2xl border border-[var(--sage-200)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--sage-700)] shadow-sm transition active:scale-[0.98]">
          로그아웃 · 다른 계정으로 전환
        </LogoutButton>
      </div>
    </div>
  );
}
