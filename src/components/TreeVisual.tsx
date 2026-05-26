"use client";

import { useEffect, useRef, useState } from "react";
import {
  getNextStageSavings,
  getTreeProgressFromSavings,
  getTreeStageFromSavings,
  TREE_LABELS,
} from "@/lib/tree";

type TreeVisualProps = {
  totalSaved?: number;
  points?: number;
  animate?: boolean;
  compact?: boolean;
  theme?: "dark" | "light";
};

export function TreeVisual({
  totalSaved = 0,
  points,
  animate = false,
  compact = false,
  theme = "dark",
}: TreeVisualProps) {
  const stage = points != null
    ? Math.min(3, Math.floor(points / 10))
    : getTreeStageFromSavings(totalSaved);
  const progress = points != null
    ? (points % 10 === 0 && points > 0 ? 100 : ((points % 10) / 10) * 100)
    : getTreeProgressFromSavings(totalSaved);
  const nextNeeded = getNextStageSavings(totalSaved);

  const prevStage = useRef(stage);
  const [growing, setGrowing] = useState(false);

  useEffect(() => {
    if (stage > prevStage.current) {
      setGrowing(true);
      const t = window.setTimeout(() => setGrowing(false), 1200);
      prevStage.current = stage;
      return () => window.clearTimeout(t);
    }
    prevStage.current = stage;
  }, [stage]);

  const showAnim = animate || growing;

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`tree-scene relative flex w-full items-end justify-center overflow-hidden rounded-2xl px-4 pb-5 ${
          compact ? "h-48" : "h-56"
        } ${showAnim ? "tree-pop" : ""}`}
        style={{
          background: "linear-gradient(180deg, rgba(135,206,250,0.35) 0%, rgba(82,183,136,0.25) 60%, rgba(139,90,43,0.15) 100%)",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-16 rounded-t-[50%] bg-amber-900/20" />

        <span className="tree-float absolute left-4 top-4 text-sm opacity-50">🍃</span>
        <span className="tree-float delay-1 absolute right-6 top-8 text-xs opacity-40">🌿</span>

        <svg
          viewBox="0 0 200 240"
          className={`tree-sway relative drop-shadow-xl ${compact ? "h-40 w-32" : "h-48 w-40"}`}
          aria-hidden
        >
          <rect x="92" y="155" width="16" height="55" rx="8" fill="#8B5E3C" />
          <ellipse cx="100" cy="215" rx="72" ry="16" fill="#A67C52" opacity="0.35" />

          {stage === 0 && (
            <g key="seed" className={`tree-stage ${showAnim ? "tree-stage-grow" : ""}`}>
              <ellipse cx="100" cy="198" rx="14" ry="8" fill="#6D4C41" />
              <ellipse cx="100" cy="192" rx="10" ry="14" fill="#795548" />
            </g>
          )}
          {stage === 1 && (
            <g key="sprout" className={`tree-stage ${showAnim ? "tree-stage-grow" : ""}`}>
              <path d="M100 165 Q92 150 95 135 Q98 120 100 108 Q102 120 105 135 Q108 150 100 165" fill="#81C784" />
              <ellipse cx="88" cy="128" rx="14" ry="8" fill="#66BB6A" transform="rotate(-30 88 128)" />
              <ellipse cx="112" cy="128" rx="14" ry="8" fill="#66BB6A" transform="rotate(30 112 128)" />
            </g>
          )}
          {stage === 2 && (
            <g key="small" className={`tree-stage ${showAnim ? "tree-stage-grow" : ""}`}>
              <circle cx="100" cy="125" r="32" fill="#43A047" />
              <circle cx="78" cy="138" r="20" fill="#66BB6A" />
              <circle cx="122" cy="138" r="20" fill="#66BB6A" />
            </g>
          )}
          {stage === 3 && (
            <g key="big" className={`tree-stage ${showAnim ? "tree-stage-grow" : ""}`}>
              <circle cx="100" cy="100" r="48" fill="#2E7D32" />
              <circle cx="58" cy="120" r="30" fill="#388E3C" />
              <circle cx="142" cy="120" r="30" fill="#388E3C" />
              <circle cx="82" cy="82" r="6" fill="#FF7043" />
              <circle cx="118" cy="86" r="6" fill="#FFD54F" />
              <text x="100" y="55" textAnchor="middle" fontSize="14">✨</text>
            </g>
          )}
        </svg>

        {showAnim && (
          <>
            <span className="sparkle absolute left-1/4 top-6 text-xl">✨</span>
            <span className="sparkle delay-1 absolute right-1/4 top-10 text-lg">🌟</span>
            <span className="sparkle delay-2 absolute right-1/3 top-16 text-sm">💚</span>
          </>
        )}
      </div>

      <div className="mt-3 w-full px-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">{["🌰", "🌱", "🌳", "🌲"][stage]}</span>
          <p
            className={`font-title text-base ${
              theme === "dark" ? "text-white" : "text-[var(--forest-deep)]"
            }`}
          >
            {TREE_LABELS[stage]}
          </p>
        </div>
        <div className={`progress-track mt-2.5 ${theme === "light" ? "light" : ""}`}>
          <div
            className="progress-fill tree-progress-bar"
            style={{ width: `${stage >= 3 ? 100 : progress}%` }}
          />
        </div>
        <p
          className={`progress-label mt-2 text-center ${
            theme === "dark" ? "text-white/80" : "text-[var(--ink-soft)]"
          }`}
        >
          {stage >= 3
            ? "행복 나무 완성! 🎉"
            : nextNeeded != null
              ? `다음 단계까지 ${nextNeeded.toLocaleString()}원`
              : `다음 단계까지 ${10 - (points != null ? points % 10 || 0 : 0)}포인트`}
        </p>
      </div>
    </div>
  );
}
