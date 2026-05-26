"use client";

import Link from "next/link";
import { QuickRoleEnter } from "@/components/QuickRoleEnter";

export default function DirectorLoginPage() {
  return (
    <>
      <QuickRoleEnter
        autoEnter
        role="DIRECTOR"
        title="원장님"
        desc=""
        emoji="🏫"
      />
      <p className="pb-8 text-center">
        <Link href="/login" className="text-sm text-[var(--sage-600)]">
          ← 다른 통장 선택
        </Link>
      </p>
    </>
  );
}
