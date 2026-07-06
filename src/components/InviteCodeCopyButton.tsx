"use client";

import { useCallback, useEffect, useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";

type InviteCodeCopyButtonProps = {
  code: string;
  className?: string;
  label?: string;
};

export function InviteCodeCopyButton({
  code,
  className = "teacher-mini-btn mt-1 text-[10px]",
  label = "복사",
}: InviteCodeCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    setError(false);
    const ok = await copyTextToClipboard(code);
    if (ok) {
      setCopied(true);
      return;
    }
    setError(true);
  }, [code]);

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={`tap-scale ${className} ${copied ? "done" : ""}`}
        aria-label={`초대코드 ${code} 복사`}
      >
        {copied ? "복사 완료 ✓" : label}
      </button>
      {error && (
        <span className="text-[10px] font-semibold text-red-600">
          복사에 실패했어요. 코드를 길게 눌러 직접 복사해 주세요.
        </span>
      )}
    </div>
  );
}
