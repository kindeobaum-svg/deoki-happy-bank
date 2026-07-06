"use client";

import { TreeVisual } from "@/components/TreeVisual";
import { TREE_LABELS } from "@/lib/tree";

type HappinessTreeCardProps = {
  childName: string;
  childAvatar: string;
  totalSaved: number;
  animate?: boolean;
  dark?: boolean;
  className?: string;
};

const STAGE_ICONS = ["🌰", "🌱", "🌳", "🌲"];

export function HappinessTreeCard({
  childName,
  childAvatar,
  totalSaved,
  animate = false,
  dark = true,
  className = "",
}: HappinessTreeCardProps) {
  const stage = Math.min(3, [0, 200, 500, 1000].filter((t) => totalSaved >= t).length - 1);

  return (
    <section className={`forest-card ${dark ? "forest-card-dark" : ""} ${className}`}>
      <div className="forest-card-header">
        <div>
          <p className="font-title text-lg">
            {childAvatar} 행복 나무
          </p>
          <p className={`text-sm ${dark ? "text-white/75" : "text-[var(--ink-soft)]"}`}>
            {childName} · <strong className="font-semibold">{TREE_LABELS[stage]}</strong> 단계
          </p>
        </div>
        <div
          className={`rounded-2xl px-3.5 py-2 text-center ${
            dark ? "bg-white/12 ring-1 ring-white/15" : "bg-[var(--sage-50)] ring-1 ring-[var(--sage-200)]"
          }`}
        >
          <p className={`text-[11px] font-semibold ${dark ? "text-white/70" : "text-[var(--sage-600)]"}`}>
            총 적립
          </p>
          <p className="font-title text-base">{totalSaved.toLocaleString()}원</p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="forest-stage-track">
          {TREE_LABELS.map((label, i) => (
            <div
              key={label}
              className={`forest-stage-pill ${dark ? (i <= stage ? "done" : "pending") : i <= stage ? "light-done" : "light-pending"}`}
            >
              <span className="icon">{STAGE_ICONS[i]}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="forest-card-body pt-0">
        <TreeVisual totalSaved={totalSaved} animate={animate} />
      </div>
    </section>
  );
}
