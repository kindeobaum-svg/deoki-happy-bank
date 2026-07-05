"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/hooks/useAppStore";
import { useRequireRole } from "@/hooks/useRequireRole";
import { PageHeader } from "@/components/PageHeader";
import {
  TeacherSectionMenu,
  TEACHER_SECTION_LABELS,
  type TeacherSection,
} from "@/components/teacher/TeacherSectionMenu";
import { TeacherClassPanel, useTeacherClassesBootstrap } from "@/components/teacher/TeacherClassPanel";
import { TeacherChildPanel } from "@/components/teacher/TeacherChildPanel";
import { TeacherQuickPassbookPanel } from "@/components/teacher/TeacherQuickPassbookPanel";

export default function TeacherPage() {
  useRequireRole("TEACHER", "DIRECTOR");
  const { state, addPraise, addChild, updateChild, deleteChild } = useApp();
  const [activeSection, setActiveSection] = useState<TeacherSection | null>(null);

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
    <div className="teacher-page space-y-4 pb-2">
      <PageHeader
        badge="교사 모드"
        title="행복숲 · 30초 관리"
        subtitle="메뉴를 선택해 주세요"
      />

      <TeacherSectionMenu active={activeSection} onSelect={setActiveSection} />

      {activeSection && (
        <div className="teacher-section-panel">
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            className="teacher-section-back tap-scale"
          >
            ← 메뉴로
          </button>
          <p className="teacher-section-title">{TEACHER_SECTION_LABELS[activeSection]}</p>
        </div>
      )}

      {activeSection === "classes" && (
        <div id="classes" className="scroll-target">
          <TeacherClassPanel
            children={state.children}
            onClassRenamed={handleClassRenamed}
          />
        </div>
      )}

      {activeSection === "invite" && (
        <div id="invite-parent" className="scroll-target">
          <TeacherChildPanel
            children={state.children}
            onAddChild={addChild}
            onUpdateChild={updateChild}
            onDeleteChild={deleteChild}
          />
        </div>
      )}

      {activeSection === "missions" && (
        <div id="missions" className="scroll-target">
          <TeacherQuickPassbookPanel
            children={state.children}
            praiseRecords={state.praiseRecords}
            onAddPraise={addPraise}
            panelTitle="미션 확인"
            panelSubtitle="오늘의 미션 현황과 적립"
          />
        </div>
      )}

      {activeSection === "deposit" && (
        <div id="missions-deposit" className="scroll-target">
          <TeacherQuickPassbookPanel
            children={state.children}
            praiseRecords={state.praiseRecords}
            onAddPraise={addPraise}
            panelTitle="통장 입금"
            panelSubtitle="탭 한 번 = 칭찬 + 입금"
          />
        </div>
      )}

      {!activeSection && (
        <p className="teacher-page-hint">위 메뉴 4개 중 하나를 선택하세요.</p>
      )}
    </div>
  );
}
