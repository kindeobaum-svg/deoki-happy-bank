"use client";

import { useMemo } from "react";
import { useApp } from "@/hooks/useAppStore";
import { useRequireRole } from "@/hooks/useRequireRole";
import { PageHeader } from "@/components/PageHeader";
import { RoleQuickNav } from "@/components/RoleQuickNav";
import { TeacherClassPanel, useTeacherClassesBootstrap } from "@/components/teacher/TeacherClassPanel";
import { TeacherChildPanel } from "@/components/teacher/TeacherChildPanel";
import { TeacherQuickPassbookPanel } from "@/components/teacher/TeacherQuickPassbookPanel";

export default function TeacherPage() {
  useRequireRole("TEACHER", "DIRECTOR");
  const { state, addPraise, addChild, updateChild, deleteChild } = useApp();

  const classNames = useMemo(
    () => state.children.map((c) => c.className),
    [state.children],
  );
  useTeacherClassesBootstrap(classNames);

  async function handleClassRenamed(oldName: string, newName: string) {
    const targets = state.children.filter((c) => c.className === oldName);
    await Promise.all(
      targets.map((c) => updateChild(c.id, { className: newName })),
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <PageHeader
        badge="교사 모드"
        title="행복숲 · 30초 관리"
        subtitle="반 · 원아 · 미션 적립"
      />

      <RoleQuickNav
        items={[
          { href: "/teacher#invite-parent", emoji: "💌", title: "학부모 초대", desc: "초대코드 만들기" },
          { href: "/teacher#missions", emoji: "🎯", title: "미션 확인", desc: "오늘의 미션 현황" },
          {
            href: "/teacher#missions",
            emoji: "💰",
            title: "통장 입금",
            desc: "30초 미션 적립",
            variant: "peach",
          },
        ]}
      />

      <div id="classes" className="scroll-target">
        <TeacherClassPanel
          children={state.children}
          onClassRenamed={handleClassRenamed}
        />
      </div>

      <div id="invite-parent" className="scroll-target">
        <TeacherChildPanel
          children={state.children}
          onAddChild={addChild}
          onUpdateChild={updateChild}
          onDeleteChild={deleteChild}
        />
      </div>

      <div id="missions" className="scroll-target">
        <TeacherQuickPassbookPanel
          children={state.children}
          praiseRecords={state.praiseRecords}
          onAddPraise={addPraise}
        />
      </div>
    </div>
  );
}
