"use client";

import type { PraiseRecord } from "@/lib/types";

type TodayPraiseCardProps = {
  praises: PraiseRecord[];
  childName: string;
  childAvatar: string;
};

const EXAMPLE_PRAISE = {
  emoji: "👋",
  message: "친구에게 먼저 인사 했어요",
};

export function TodayPraiseCard({ praises, childName, childAvatar }: TodayPraiseCardProps) {
  return (
    <section className="forest-card forest-card-gold">
      <div className="forest-card-header">
        <div className="parent-section-title" style={{ color: "#5d4037" }}>
          <span className="text-2xl">⭐</span>
          오늘의 칭찬
          <span className="badge" style={{ background: "#ffe082", color: "#5d4037" }}>
            PRAISE
          </span>
        </div>
      </div>

      <div className="forest-card-body pt-2">
        <ul className="space-y-2.5">
          {praises.length > 0 ? (
            praises.map((p) => (
              <li key={p.id} className="forest-praise-item">
                <span className="forest-praise-emoji">{p.emoji}</span>
                <div>
                  <p className="forest-praise-text">{p.message}</p>
                  <p className="mt-1 text-xs text-[#8d6e63]">
                    {childAvatar} {childName} · {p.author}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="forest-praise-item empty">
              <span className="forest-praise-emoji">{EXAMPLE_PRAISE.emoji}</span>
              <div>
                <p className="forest-praise-text">{EXAMPLE_PRAISE.message}</p>
                <p className="mt-1 text-xs text-[#8d6e63]">
                  오늘 받은 칭찬을 기다리고 있어요 🌱
                </p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
