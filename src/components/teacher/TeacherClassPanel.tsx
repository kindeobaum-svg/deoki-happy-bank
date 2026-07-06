"use client";

import { useState } from "react";
import type { Child, ClassRoom } from "@/lib/types";

type TeacherClassPanelProps = {
  classes: ClassRoom[];
  children?: Child[];
  onAddClass: (name: string) => Promise<{ error?: string }>;
  onUpdateClass: (id: string, name: string) => Promise<{ error?: string }>;
  onDeleteClass: (id: string) => Promise<{ error?: string }>;
};

export function TeacherClassPanel({
  classes,
  children = [],
  onAddClass,
  onUpdateClass,
  onDeleteClass,
}: TeacherClassPanelProps) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    const result = await onAddClass(trimmed);
    setLoading(false);
    if (!result.error) {
      setName("");
    }
  }

  function startEdit(cls: ClassRoom) {
    setEditingId(cls.id);
    setEditName(cls.name);
  }

  async function saveEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setLoading(true);
    const result = await onUpdateClass(id, trimmed);
    setLoading(false);
    if (!result.error) {
      setEditingId(null);
      setEditName("");
    }
  }

  async function handleDelete(id: string) {
    const cls = classes.find((c) => c.id === id);
    if (!cls) return;
    const hasChildren = children.some((c) => c.className === cls.name);
    if (hasChildren) return;
    setLoading(true);
    await onDeleteClass(id);
    setLoading(false);
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
          onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
          disabled={loading}
        />
        <button type="button" onClick={() => void handleAdd()} disabled={loading || !name.trim()} className="teacher-inline-btn">
          {loading ? "..." : "+ 반 추가"}
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
                    onKeyDown={(e) => e.key === "Enter" && void saveEdit(cls.id)}
                    disabled={loading}
                  />
                  <button type="button" onClick={() => void saveEdit(cls.id)} className="teacher-mini-btn primary" disabled={loading}>
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
                    onClick={() => void handleDelete(cls.id)}
                    disabled={childCount > 0 || loading}
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

export function useTeacherClassSelection(classes: ClassRoom[]) {
  const [manualSelection, setManualSelection] = useState<string | null>(null);

  const selectedClass =
    manualSelection && classes.some((c) => c.name === manualSelection)
      ? manualSelection
      : classes[0]?.name ?? "";

  return { selectedClass, setSelectedClass: setManualSelection };
}
