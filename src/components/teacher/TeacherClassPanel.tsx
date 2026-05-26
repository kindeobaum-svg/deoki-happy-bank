"use client";

import { useEffect, useState } from "react";
import {
  addTeacherClass,
  bootstrapClassesFromChildren,
  deleteTeacherClass,
  loadTeacherClasses,
  type TeacherClass,
  updateTeacherClass,
} from "@/lib/teacherClasses";

import type { Child } from "@/lib/types";

type TeacherClassPanelProps = {
  children?: Child[];
  onClassRenamed?: (oldName: string, newName: string) => void;
};

export function TeacherClassPanel({ children = [], onClassRenamed }: TeacherClassPanelProps) {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function reload() {
    setClasses(loadTeacherClasses());
  }

  useEffect(() => {
    reload();
    const onUpdate = () => reload();
    window.addEventListener("teacher-classes-updated", onUpdate);
    return () => window.removeEventListener("teacher-classes-updated", onUpdate);
  }, []);

  function handleAdd() {
    const entry = addTeacherClass(name);
    if (entry) {
      setName("");
      reload();
    }
  }

  function startEdit(cls: TeacherClass) {
    setEditingId(cls.id);
    setEditName(cls.name);
  }

  function saveEdit(id: string) {
    const oldName = classes.find((c) => c.id === id)?.name;
    const trimmed = editName.trim();
    if (updateTeacherClass(id, trimmed)) {
      if (oldName && oldName !== trimmed) {
        onClassRenamed?.(oldName, trimmed);
      }
      setEditingId(null);
      setEditName("");
      reload();
    }
  }

  function handleDelete(id: string) {
    const cls = classes.find((c) => c.id === id);
    if (!cls) return;
    const hasChildren = children.some((c) => c.className === cls.name);
    if (hasChildren) return;
    deleteTeacherClass(id);
    reload();
  }

  return (
    <section className="teacher-panel card-warm rounded-3xl p-4">
      <div className="teacher-panel-head">
        <p className="teacher-panel-title">🏫 반 관리</p>
        <p className="teacher-panel-desc">반 이름 입력 후 추가 · 30초 설정</p>
      </div>

      <div className="teacher-inline-form mt-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) 햇님반, 달림반"
          className="input-warm teacher-inline-input flex-1 px-3 py-2.5 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button type="button" onClick={handleAdd} className="teacher-inline-btn">
          + 반 추가
        </button>
      </div>

      {classes.length === 0 ? (
        <p className="teacher-panel-empty mt-3">등록된 반이 없어요. 반을 먼저 추가해 주세요.</p>
      ) : (
        <ul className="teacher-class-list mt-3 space-y-2">
          {classes.map((cls) => {
            const childCount = children.filter((c) => c.className === cls.name).length;
            return (
            <li key={cls.id} className="teacher-class-row">
              {editingId === cls.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-warm flex-1 px-3 py-2 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(cls.id)}
                  />
                  <button type="button" onClick={() => saveEdit(cls.id)} className="teacher-mini-btn primary">
                    저장
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="teacher-mini-btn">
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="teacher-class-name">
                    {cls.name}
                    {childCount > 0 && (
                      <span className="ml-1 text-[10px] font-semibold text-[var(--ink-soft)]">
                        ({childCount}명)
                      </span>
                    )}
                  </span>
                  <button type="button" onClick={() => startEdit(cls)} className="teacher-mini-btn">
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cls.id)}
                    disabled={childCount > 0}
                    title={childCount > 0 ? "원아가 있는 반은 삭제할 수 없어요" : undefined}
                    className="teacher-mini-btn danger disabled:opacity-40"
                  >
                    삭제
                  </button>
                </>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function useTeacherClassesBootstrap(classNames: string[]) {
  useEffect(() => {
    bootstrapClassesFromChildren(classNames);
  }, [classNames]);
}
