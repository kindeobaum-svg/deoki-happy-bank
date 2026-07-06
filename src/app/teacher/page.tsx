"use client";

import { useEffect } from "react";
import { useApp } from "@/hooks/useAppStore";
import { useRequireRole } from "@/hooks/useRequireRole";
import { PageHeader } from "@/components/PageHeader";
import { RoleQuickNav } from "@/components/RoleQuickNav";
import { TeacherClassPanel } from "@/components/teacher/TeacherClassPanel";
import { TeacherChildPanel } from "@/components/teacher/TeacherChildPanel";
import { TeacherQuickPassbookPanel } from "@/components/teacher/TeacherQuickPassbookPanel";

export default function TeacherPage() {
  useRequireRole("TEACHER");
  const {
    state,
    refresh,
    addPraise,
    addChild,
    updateChild,
    deleteChild,
    addClass,
    updateClass,
    deleteClass,
  } = useApp();

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
          classes={state.classes}
          children={state.children}
          onAddClass={addClass}
          onUpdateClass={updateClass}
          onDeleteClass={deleteClass}
        />
      </div>

      <div id="invite-parent" className="scroll-target">
        <TeacherChildPanel
          classes={state.classes}
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
