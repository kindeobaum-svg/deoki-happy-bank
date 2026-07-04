"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/hooks/useAppStore";
import { useRequireRole } from "@/hooks/useRequireRole";
import { PageHeader } from "@/components/PageHeader";
import { SimpleTabBar } from "@/components/SimpleTabBar";
import { TeacherClassPanel, useTeacherClassesBootstrap } from "@/components/teacher/TeacherClassPanel";
import { TeacherChildPanel } from "@/components/teacher/TeacherChildPanel";
import { TeacherQuickPassbookPanel } from "@/components/teacher/TeacherQuickPassbookPanel";

const TEACHER_TABS = [
  { id: "classes", emoji: "🏫", label: "반" },
  { id: "children", emoji: "👶", label: "원아" },
  { id: "missions", emoji: "⭐", label: "적립" },
] as const;

type TeacherTab = (typeof TEACHER_TABS)[number]["id"];

export default function TeacherPage() {
  useRequireRole("TEACHER", "DIRECTOR");
  const { state, addPraise, addChild, updateChild, deleteChild } = useApp();
  const [activeTab, setActiveTab] = useState<TeacherTab>("missions");

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
    <div className="simple-page">
      <PageHeader
        badge="교사"
        title="행복숲 관리"
        subtitle="반 · 원아 · 미션 적립"
      />

      <SimpleTabBar
        tabs={[...TEACHER_TABS]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as TeacherTab)}
        className="mb-6"
      />

      {activeTab === "classes" && (
        <div id="classes" className="scroll-target">
          <TeacherClassPanel
            children={state.children}
            onClassRenamed={handleClassRenamed}
          />
        </div>
      )}

      {activeTab === "children" && (
        <div id="invite-parent" className="scroll-target">
          <TeacherChildPanel
            children={state.children}
            onAddChild={addChild}
            onUpdateChild={updateChild}
            onDeleteChild={deleteChild}
          />
        </div>
      )}

      {activeTab === "missions" && (
        <div id="missions" className="scroll-target">
          <TeacherQuickPassbookPanel
            children={state.children}
            praiseRecords={state.praiseRecords}
            onAddPraise={addPraise}
          />
        </div>
      )}
    </div>
  );
}
