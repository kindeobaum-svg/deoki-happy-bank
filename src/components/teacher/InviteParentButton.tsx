"use client";

import { useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";
import { formatInviteCode } from "@/lib/inviteCodeUtils";

type InviteParentButtonProps = {
  childId: string;
  childName: string;
};

export function InviteParentButton({ childId, childName }: InviteParentButtonProps) {
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
        body: JSON.stringify({ targetRole: "PARENT", childId }),
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
    <div className="mt-1">
      {!code ? (
        <button
          type="button"
          onClick={() => void createInvite()}
          disabled={loading}
          className="teacher-mini-btn primary text-[10px]"
        >
          {loading ? "생성 중..." : "학부모 초대"}
        </button>
      ) : (
        <div className="mt-1 rounded-xl bg-[var(--sage-50)] px-2 py-1.5">
          <p className="text-[10px] text-[var(--ink-soft)]">{childName} 학부모 초대코드</p>
          <p className="font-mono text-xs font-bold tracking-wider text-[var(--sage-800)]">{code}</p>
          <button
            type="button"
            onClick={() => void copyCode()}
            className={`teacher-mini-btn mt-1 text-[10px] ${copyState === "copied" ? "primary" : ""}`}
            aria-live="polite"
          >
            {copyLabel}
          </button>
          {copyState === "copied" && (
            <p className="mt-1 text-[10px] font-semibold text-[var(--sage-700)]" role="status">
              초대코드가 복사되었어요
            </p>
          )}
          {copyState === "failed" && (
            <p className="mt-1 text-[10px] font-semibold text-red-600" role="alert">
              복사에 실패했어요. 코드를 길게 눌러 직접 복사해 주세요.
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
