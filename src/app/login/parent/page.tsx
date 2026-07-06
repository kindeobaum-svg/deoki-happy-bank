"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickRoleEnter } from "@/components/QuickRoleEnter";
import { PassbookShell } from "@/components/passbook/PassbookShell";
import { useApp } from "@/hooks/useAppStore";
import { PASSBOOK_NAME } from "@/lib/branding";
import { fetchParentHomePath, redirectToParentHome } from "@/lib/parentHomeClient";

export default function ParentLoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { homePath } = await fetchParentHomePath();
      if (cancelled) return;
      if (homePath) {
        router.replace(homePath);
        router.refresh();
        return;
      }
      setCheckingSession(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password, "PARENT");
    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    const { ok, error: redirectError } = await redirectToParentHome(router);
    setLoading(false);

    if (!ok) {
      setError(redirectError ?? "원아 연결 정보를 불러오지 못했습니다.");
    }
  }

  if (checkingSession) {
    return (
      <div className="quick-enter-loading py-12">
        <p className="font-title text-base text-[var(--passbook-navy-deep)]">연결 정보 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2 pb-6">
      <PassbookShell open={false} tagline="학부모 통장 로그인" />

      <form onSubmit={(e) => void handleLogin(e)} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="가입할 때 입력한 이메일"
            className="input-warm w-full px-3 py-2.5 text-sm"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="input-warm w-full px-3 py-2.5 text-sm"
            required
            autoComplete="current-password"
            minLength={4}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="passbook-role-card passbook-role-card-primary w-full text-center font-display font-bold text-[var(--sage-800)] disabled:opacity-60"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--ink-soft)]">
        처음이신가요?{" "}
        <Link href="/login/parent/join" className="font-semibold text-[var(--sage-600)]">
          초대코드로 가입하기 →
        </Link>
      </p>

      <div className="relative py-1">
        <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--sage-200)]" />
        <p className="relative mx-auto w-fit bg-[var(--page-bg,#f7faf5)] px-3 text-xs text-[var(--ink-soft)]">
          데모 체험
        </p>
      </div>

      <QuickRoleEnter
        role="PARENT"
        title={`${PASSBOOK_NAME} (데모)`}
        desc="버튼을 눌러 김하늘 통장 체험"
        emoji="💚"
      />

      <p className="text-center">
        <Link href="/login" className="text-sm text-[var(--sage-600)]">
          ← 역할 다시 선택
        </Link>
      </p>
    </div>
  );
}
