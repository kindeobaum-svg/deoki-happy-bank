"use client";

import type { PraiseRecord } from "@/lib/types";

export function PraiseList({
  praises,
  childName,
  childAvatar,
}: {
  praises: PraiseRecord[];
  childName: string;
  childAvatar: string;
}) {
  if (praises.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-green-600">오늘 받은 칭찬이 아직 없어요.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {praises.map((p) => (
        <li key={p.id} className="praise-item flex items-start gap-3 rounded-2xl px-4 py-3">
          <span className="text-2xl">{p.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-green-900">{p.message}</p>
            <p className="mt-0.5 text-xs text-green-600">
              {childAvatar} {childName} · {p.author}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
