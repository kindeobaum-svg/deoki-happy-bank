"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PassbookLink } from "@/components/HappinessPassbook";
import { DAYCARE_NAME } from "@/lib/branding";
import { getTreeStage, TREE_LABELS } from "@/lib/tree";

type AdminStats = {
  totalChildren: number;
  totalSaved: number;
  totalPoints: number;
  todaySaves: number;
  parentCount: number;
  teacherCount: number;
  children: {
    id: string;
    name: string;
    className: string;
    avatar: string;
    accountNumber: string;
    points: number;
    totalSaved: number;
  }[];
  recentSaves: {
    id: string;
    message: string;
    amount: number;
    createdAt: string;
    childName: string;
    childAvatar: string;
  }[];
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center text-green-700">관리 현황 불러오는 중...</p>;
  }

  if (!stats) {
    return <p className="text-center text-red-600">데이터를 불러올 수 없습니다.</p>;
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold text-green-600">원장 관리자</p>
        <h1
          className="mt-1 text-2xl font-bold text-green-900"
          style={{ fontFamily: "var(--font-jua)" }}
        >
          {DAYCARE_NAME} 현황
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="전체 원아" value={`${stats.totalChildren}명`} emoji="👶" />
        <StatCard label="총 적립액" value={`${stats.totalSaved.toLocaleString()}원`} emoji="💰" />
        <StatCard label="오늘 적립" value={`${stats.todaySaves}건`} emoji="✨" />
        <StatCard label="학부모·교사" value={`${stats.parentCount}·${stats.teacherCount}`} emoji="👥" />
      </section>

      <section className="card-warm rounded-3xl p-5">
        <p className="text-sm font-bold text-green-800">원아별 행복 적립 통장</p>
        <ul className="mt-3 space-y-3">
          {stats.children.map((child) => {
            const stage = getTreeStage(child.points);
            return (
              <li
                key={child.id}
                className="rounded-2xl bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{child.avatar}</span>
                    <div>
                      <p className="font-semibold text-green-900">{child.name}</p>
                      <p className="text-xs text-green-600">
                        {child.className} · {child.accountNumber}
                      </p>
                      <p className="text-xs text-green-500">{TREE_LABELS[stage]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-800">
                      {child.totalSaved.toLocaleString()}원
                    </p>
                    <PassbookLink childId={child.id} label="통장" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card-warm rounded-3xl p-5">
        <p className="text-sm font-bold text-green-800">최근 적립 활동</p>
        <ul className="mt-3 space-y-2">
          {stats.recentSaves.map((save) => (
            <li key={save.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
              <span className="font-semibold text-green-900">
                {save.childAvatar} {save.childName}
              </span>
              {" · "}
              {save.message}
              <span className="float-right font-bold text-green-600">
                +{save.amount.toLocaleString()}원
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/teacher"
          className="card-warm rounded-2xl p-4 text-center text-sm font-semibold text-green-800"
        >
          👩‍🏫 교사 관리
        </Link>
        <Link
          href="/passbook"
          className="card-warm rounded-2xl p-4 text-center text-sm font-semibold text-green-800"
        >
          📒 통장 전체
        </Link>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <div className="card-warm rounded-2xl p-4 text-center">
      <span className="text-2xl">{emoji}</span>
      <p className="mt-1 text-xs text-green-600">{label}</p>
      <p className="text-lg font-bold text-green-900">{value}</p>
    </div>
  );
}
