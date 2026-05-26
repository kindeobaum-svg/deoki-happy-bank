"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/hooks/useAppStore";
import { PassbookShell } from "@/components/passbook/PassbookShell";
import { QuickRoleEnter } from "@/components/QuickRoleEnter";
import { PASSBOOK_NAME } from "@/lib/branding";
import { SHOWCASE_CHILD_NAME } from "@/lib/demoAccess";

export default function HomePage() {
  const { state } = useApp();
  const router = useRouter();
  const user = state.user;

  useEffect(() => {
    if (user?.role === "PARENT") {
      router.replace("/passbook");
    }
  }, [user, router]);

  if (user?.role === "PARENT") {
    return (
      <p className="py-12 text-center text-[var(--ink-soft)]">
        {SHOWCASE_CHILD_NAME}의 {PASSBOOK_NAME}으로 이동 중...
      </p>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 pt-2">
        <PassbookShell open={false} tagline="우리 아이의 하루를 따뜻하게 함께해요" />

        <div className="mx-auto max-w-sm space-y-3 px-1">
          <QuickRoleEnter
            role="PARENT"
            title={`${SHOWCASE_CHILD_NAME} ${PASSBOOK_NAME}`}
            desc="한 번의 터치로 바로 열기"
            emoji="📒"
            primary
          />

          <div className="grid grid-cols-2 gap-2">
            <QuickRoleEnter
              role="TEACHER"
              title="선생님"
              desc="바로 시작"
              emoji="👩‍🏫"
            />
            <QuickRoleEnter
              role="DIRECTOR"
              title="원장님"
              desc="현황 보기"
              emoji="🏫"
            />
          </div>

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
    { href: "/teacher", emoji: "👩‍🏫", title: "교사 모드", roles: ["TEACHER", "DIRECTOR"] },
    { href: "/passbook", emoji: "📒", title: PASSBOOK_NAME, roles: ["PARENT"] },
    { href: "/child", emoji: "🌱", title: "원아 모드", roles: ["CHILD", "TEACHER", "DIRECTOR"] },
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
    </div>
  );
}
