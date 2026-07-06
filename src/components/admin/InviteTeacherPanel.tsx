"use client";

import { useState } from "react";
import { formatInviteCode } from "@/lib/inviteCodeUtils";
import { InviteCodeCopyButton } from "@/components/InviteCodeCopyButton";

export function InviteTeacherPanel() {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createInvite() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: "TEACHER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "초대코드를 만들지 못했습니다.");
        return;
      }
      setCode(data.invite.formattedCode ?? formatInviteCode(data.invite.code));
    } catch {
      setError("초대코드를 만들지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="forest-card">
      <div className="forest-card-header">
        <div className="parent-section-title">
          <span className="text-2xl">🏫</span>
          교사 초대
        </div>
      </div>
      <div className="forest-card-body pt-2">
        <p className="text-xs text-[var(--ink-soft)]">
          새 담임 선생님이 초대코드로 가입할 수 있어요
        </p>
        {!code ? (
          <button
            type="button"
            onClick={() => void createInvite()}
            disabled={loading}
            className="forest-accumulate-btn tap-scale mt-3 w-full disabled:opacity-60"
          >
            <span className="forest-accumulate-icon">{loading ? "…" : "✉️"}</span>
            {loading ? "생성 중..." : "교사 초대코드 만들기"}
          </button>
        ) : (
          <div className="mt-3 rounded-2xl bg-[var(--sage-50)] px-4 py-3 ring-1 ring-[var(--sage-200)]">
            <p className="text-[10px] font-bold text-[var(--sage-600)]">교사 초대코드</p>
            <p className="select-all mt-1 font-mono text-lg font-bold tracking-wider text-[var(--sage-800)]">
              {code}
            </p>
            <InviteCodeCopyButton
              code={code}
              className="forest-link-btn mt-2 inline-block"
              label="복사"
            />
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </section>
  );
}
