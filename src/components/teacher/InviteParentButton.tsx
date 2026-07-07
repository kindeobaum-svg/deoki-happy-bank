"use client";

import { useState } from "react";
import { formatInviteCode } from "@/lib/inviteCodeUtils";
import { InviteCodeCopyButton } from "@/components/InviteCodeCopyButton";

type InviteParentButtonProps = {
  childId: string;
  childName: string;
  accountNumber: string;
  className: string;
};

export function InviteParentButton({
  childId,
  childName,
  accountNumber,
  className,
}: InviteParentButtonProps) {
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
        body: JSON.stringify({
          targetRole: "PARENT",
          childId,
          accountNumber,
          childName,
          className,
        }),
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
          <p className="select-all font-mono text-xs font-bold tracking-wider text-[var(--sage-800)]">
            {code}
          </p>
          <InviteCodeCopyButton code={code} />
        </div>
      )}
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
