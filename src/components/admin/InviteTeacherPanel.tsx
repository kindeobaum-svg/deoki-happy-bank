"use client";

import { useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";
import { formatInviteCode } from "@/lib/inviteCodeUtils";

export function InviteTeacherPanel() {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function createInvite() {
    setLoading(true);
    setError("");
    setCopyState("idle");
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

  async function copyCode() {
    if (!code) return;
    const ok = await copyTextToClipboard(code);
    setCopyState(ok ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 2500);
  }

  const copyLabel =
    copyState === "copied" ? "복사됨 ✓" : copyState === "failed" ? "복사 실패" : "복사";

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
            <p className="mt-1 font-mono text-lg font-bold tracking-wider text-[var(--sage-800)]">
              {code}
            </p>
            <button
              type="button"
              onClick={() => void copyCode()}
              className={`forest-link-btn mt-2 inline-block ${copyState === "copied" ? "font-bold text-[var(--sage-800)]" : ""}`}
              aria-live="polite"
            >
              {copyLabel}
            </button>
            {copyState === "copied" && (
              <p className="mt-1 text-xs font-semibold text-[var(--sage-700)]" role="status">
                초대코드가 복사되었어요
              </p>
            )}
            {copyState === "failed" && (
              <p className="mt-1 text-xs font-semibold text-red-600" role="alert">
                복사에 실패했어요. 코드를 길게 눌러 직접 복사해 주세요.
              </p>
            )}
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </section>
  );
}
