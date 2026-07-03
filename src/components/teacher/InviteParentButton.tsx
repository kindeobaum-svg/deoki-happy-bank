"use client";

import { useState } from "react";
import { formatInviteCode } from "@/lib/inviteCodeUtils";

type InviteParentButtonProps = {
  childId: string;
  childName: string;
};

export function InviteParentButton({ childId, childName }: InviteParentButtonProps) {
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
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore clipboard errors
    }
  }

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
          <button type="button" onClick={() => void copyCode()} className="teacher-mini-btn mt-1 text-[10px]">
            복사
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
