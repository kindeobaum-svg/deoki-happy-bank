"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";
import { PassbookShell } from "@/components/passbook/PassbookShell";

export default function TeacherJoinPage() {
  const router = useRouter();
  const { refresh } = useApp();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verifyCode() {
    setLoading(true);
    setError("");
    setVerified(false);
    try {
      const res = await fetch("/api/invites/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "유효하지 않은 코드입니다.");
        return;
      }
      if (data.targetRole !== "TEACHER") {
        setError("교사용 초대코드가 아닙니다.");
        return;
      }
      setVerified(true);
    } catch {
      setError("코드 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
        return;
      }
      await refresh();
      router.push("/teacher");
      router.refresh();
    } catch {
      setError("가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 pt-2 pb-6">
      <PassbookShell open={false} tagline="초대코드로 교사 계정 만들기" />

      <form onSubmit={(e) => void handleJoin(e)} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]">초대코드</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예) ABCD-1234"
              className="input-warm flex-1 px-3 py-2.5 text-sm uppercase"
            />
            <button
              type="button"
              onClick={() => void verifyCode()}
              disabled={loading || !code.trim()}
              className="teacher-inline-btn shrink-0"
            >
              확인
            </button>
          </div>
          {verified && (
            <p className="mt-1 text-xs font-semibold text-[var(--sage-700)]">
              ✓ 교사 초대코드가 확인됐어요
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-warm w-full px-3 py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-warm w-full px-3 py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-warm w-full px-3 py-2.5 text-sm"
            required
            minLength={4}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="passbook-role-card w-full text-center font-display font-bold text-[var(--sage-800)] disabled:opacity-60"
        >
          {loading ? "가입 중..." : "초대코드로 가입하기"}
        </button>
      </form>

      <p className="text-center">
        <Link href="/login/teacher" className="text-sm text-[var(--sage-600)]">
          ← 데모 교사 모드로 돌아가기
        </Link>
      </p>
    </div>
  );
}
