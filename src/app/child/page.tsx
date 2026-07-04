"use client";

import { useState } from "react";
import { AccumulateButton } from "@/components/AccumulateButton";
import { TreeVisual } from "@/components/TreeVisual";
import { PassbookLink } from "@/components/HappinessPassbook";
import { ParentHero } from "@/components/parent/ParentHero";
import { SimpleIconGrid } from "@/components/SimpleIconGrid";
import { useApp } from "@/hooks/useAppStore";
import { SAVE_AMOUNT } from "@/lib/tree";

const PRAISE_MESSAGES = [
  "오늘도 잘했어요!",
  "친구와 나눴어요!",
  "스스로 했어요!",
  "웃음이 예뻐요!",
];

export default function ChildPage() {
  const { state, selectedChild, accumulate, selectChild } = useApp();
  const [justSaved, setJustSaved] = useState(false);
  const [message, setMessage] = useState(PRAISE_MESSAGES[0]);
  const isParent = state.user?.role === "PARENT";

  const child = selectedChild ?? state.children[0];

  function handleAccumulate() {
    if (!child) return;
    accumulate(child.id, message);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 800);
  }

  if (!child) {
    return <p className="simple-empty-page">원아 정보를 불러올 수 없어요.</p>;
  }

  return (
    <div className="simple-page">
      <ParentHero
        greeting={isParent ? "행복 나무" : "원아"}
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={isParent ? "우리 아이의 나무" : "행복을 모아요"}
      />

      {state.children.length > 1 && (
        <section className="simple-card compact">
          <div className="simple-card-body">
            <div className="simple-child-picker">
              {state.children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChild(c.id)}
                  className={`simple-child-chip tap-scale ${child.id === c.id ? "active" : ""}`}
                >
                  <span>{c.avatar}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="simple-card">
        <div className="simple-card-body space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="simple-list-title">{child.avatar} {child.name}</p>
              <p className="simple-list-desc">{child.className}</p>
            </div>
            <div className="simple-child-balance">
              <p className="simple-hint">모은 행복</p>
              <p className="simple-big-number">{child.totalSaved.toLocaleString()}원</p>
              <PassbookLink childId={child.id} label="통장" />
            </div>
          </div>

          <TreeVisual points={child.points} animate={justSaved} theme="light" />

          {!isParent && (
            <div className="flex flex-col items-center gap-4 py-2">
              <AccumulateButton onAccumulate={handleAccumulate} />
              <p className="simple-center-hint">
                버튼을 누를 때마다 {SAVE_AMOUNT}원 적립
              </p>
            </div>
          )}

          {isParent && (
            <p className="simple-center-hint">
              {child.name}의 나무는 행복 포인트 {child.points}개만큼 자랐어요.
            </p>
          )}
        </div>
      </section>

      {!isParent && (
        <section className="simple-card">
          <div className="simple-card-header">
            <p className="simple-section-title">
              <span aria-hidden>💬</span>
              칭찬 한마디
            </p>
          </div>
          <div className="simple-card-body">
            <SimpleIconGrid
              columns={2}
              items={PRAISE_MESSAGES.map((msg) => ({
                emoji: msg.includes("친구") ? "🤝" : msg.includes("스스로") ? "🌱" : msg.includes("웃음") ? "😊" : "⭐",
                label: msg.replace("!", ""),
                onClick: () => setMessage(msg),
                active: message === msg,
              }))}
            />
          </div>
        </section>
      )}
    </div>
  );
}
