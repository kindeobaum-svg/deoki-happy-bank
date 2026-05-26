"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/useAppStore";
import { PageHeader } from "@/components/PageHeader";
import { TeacherClassPanel, useTeacherClassesBootstrap } from "@/components/teacher/TeacherClassPanel";
import { TeacherChildPanel } from "@/components/teacher/TeacherChildPanel";
import { TeacherQuickPassbookPanel } from "@/components/teacher/TeacherQuickPassbookPanel";

export default function TeacherPage() {
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

      <TeacherClassPanel
        children={state.children}
        onClassRenamed={handleClassRenamed}
      />

      <TeacherChildPanel
        children={state.children}
        onAddChild={addChild}
        onUpdateChild={updateChild}
        onDeleteChild={deleteChild}
      />

      <TeacherQuickPassbookPanel
        children={state.children}
        praiseRecords={state.praiseRecords}
        onAddPraise={addPraise}
      />
    </div>
  );
}
