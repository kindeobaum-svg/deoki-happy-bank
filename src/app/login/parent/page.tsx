"use client";

import Link from "next/link";
import { QuickRoleEnter } from "@/components/QuickRoleEnter";
import { PASSBOOK_NAME } from "@/lib/branding";

export default function ParentLoginPage() {
  return (
    <>
      <QuickRoleEnter
        autoEnter
        role="PARENT"
        title={PASSBOOK_NAME}
        desc=""
        emoji="💚"
      />
      <p className="pb-8 text-center">
        <Link href="/login" className="text-sm text-[var(--sage-600)]">
          ← 다른 통장 선택
        </Link>
      </p>
    </>
  );
}
