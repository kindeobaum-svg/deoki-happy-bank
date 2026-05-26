"use client";

import Link from "next/link";
import { QuickRoleEnter } from "@/components/QuickRoleEnter";

export default function TeacherLoginPage() {
  return (
    <>
      <QuickRoleEnter
        autoEnter
        role="TEACHER"
        title="선생님"
        desc=""
        emoji="👩‍🏫"
      />
      <p className="pb-8 text-center">
        <Link href="/login" className="text-sm text-[var(--sage-600)]">
          ← 다른 통장 선택
        </Link>
      </p>
    </>
  );
}
