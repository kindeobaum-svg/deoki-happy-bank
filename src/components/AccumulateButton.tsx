"use client";

import { useState } from "react";

type AccumulateButtonProps = {
  onAccumulate: () => void;
  disabled?: boolean;
};

export function AccumulateButton({ onAccumulate, disabled }: AccumulateButtonProps) {
  const [pressing, setPressing] = useState(false);

  function handleClick() {
    if (disabled) return;
    setPressing(true);
    onAccumulate();
    window.setTimeout(() => setPressing(false), 600);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`group relative w-full max-w-xs overflow-hidden rounded-[2rem] bg-gradient-to-b from-green-400 to-green-600 px-8 py-6 text-white shadow-xl shadow-green-300/50 transition-transform active:scale-95 disabled:opacity-50 ${
        pressing ? "accumulate-pulse" : "hover:scale-[1.02]"
      }`}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex flex-col items-center gap-1">
        <span className="text-4xl">{pressing ? "🌳" : "💰"}</span>
        <span className="text-2xl font-black tracking-tight">적립하기</span>
        <span className="text-sm font-medium text-green-100">
          {pressing ? "나무가 자라고 있어요!" : "눌러서 행복을 모아요"}
        </span>
      </div>
    </button>
  );
}
