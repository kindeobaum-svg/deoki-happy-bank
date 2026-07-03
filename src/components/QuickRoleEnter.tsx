"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";
import { getDemoAccount, type DemoAccount } from "@/lib/demoAccess";
import type { Role } from "@/lib/types";

type QuickRoleEnterProps = {
  role: Role;
  title: string;
  desc: string;
  emoji: string;
  primary?: boolean;
  /** 지정하지 않으면 데모 계정 기본 경로 사용 */
  redirect?: string;
  /** 페이지 진입 시 자동 입장 (로딩 화면만 표시) */
  autoEnter?: boolean;
};

export function QuickRoleEnter({
  role,
  title,
  desc,
  emoji,
  primary = false,
  redirect,
  autoEnter = false,
}: QuickRoleEnterProps) {
  const { state, enterAsRole } = useApp();
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const demo = getDemoAccount(role);
  const target = redirect ?? demo.redirect;

  const enter = useCallback(async () => {
    if (entering) return;

    if (state.user?.role === role) {
      router.push(target);
      router.refresh();
      return;
    }

    setEntering(true);
    setError("");
    const result = await enterAsRole(role);
    setEntering(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(target);
    router.refresh();
  }, [entering, enterAsRole, role, router, state.user?.role, target]);

  useEffect(() => {
    if (!autoEnter || started.current) return;
    started.current = true;
    void enter();
  }, [autoEnter, enter]);

  if (autoEnter) {
    return (
      <div className="quick-enter-loading">
        <p className="quick-enter-loading-emoji float-gentle">{emoji}</p>
        <p className="mt-4 font-title text-base text-[var(--passbook-navy-deep)]">
          {entering ? `${demo.label}의 통장을 여는 중...` : title}
        </p>
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  const busy = entering;

  return (
    <button
      type="button"
      onClick={() => void enter()}
      disabled={busy}
      className={`passbook-role-card quick-role-enter tap-scale w-full text-left ${primary ? "passbook-role-card-primary" : ""} ${busy ? "quick-role-enter-busy" : ""}`}
    >
      <span className="quick-role-enter-emoji">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold text-[var(--sage-800)]">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-soft)]">{desc}</p>
        {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
      </div>
      <span className="quick-role-enter-arrow" aria-hidden>
        {busy ? "…" : "→"}
      </span>
    </button>
  );
}

export function getQuickEnterMeta(role: Role): Pick<QuickRoleEnterProps, "role" | "redirect"> & DemoAccount {
  return { role, ...getDemoAccount(role) };
}
