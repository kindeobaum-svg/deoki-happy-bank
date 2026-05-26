"use client";

import { useEffect, useMemo, useState } from "react";
import type { Child } from "@/lib/types";
import { loadTeacherClasses, type TeacherClass } from "@/lib/teacherClasses";
import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";
import { ChildPhotoChangeButton } from "@/components/ChildPhotoChangeButton";

type TeacherChildPanelProps = {
  children: Child[];
  onAddChild: (name: string, className: string) => Promise<{ error?: string }>;
  onUpdateChild: (
    id: string,
    data: { name?: string; className?: string; avatar?: string },
  ) => Promise<{ error?: string }>;
  onDeleteChild: (id: string) => Promise<{ error?: string }>;
};

export function TeacherChildPanel({
  children,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
}: TeacherChildPanelProps) {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [childName, setChildName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    function reload() {
      const loaded = loadTeacherClasses();
      setClasses(loaded);
      setSelectedClass((prev) => prev || loaded[0]?.name || "");
    }
    reload();
    window.addEventListener("teacher-classes-updated", reload);
    return () => window.removeEventListener("teacher-classes-updated", reload);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Child[]>();
    for (const cls of classes) {
      map.set(cls.name, []);
    }
    for (const child of children) {
      const list = map.get(child.className);
      if (list) {
        list.push(child);
      } else {
        const unassigned = map.get("_other") ?? [];
        unassigned.push(child);
        map.set("_other", unassigned);
      }
    }
    return map;
  }, [children, classes]);

  async function handleAdd() {
    if (!selectedClass || !childName.trim()) return;
    setLoading(true);
    const result = await onAddChild(childName.trim(), selectedClass);
    setLoading(false);
    if (!result.error) {
      setChildName("");
    }
  }

  async function saveEdit(child: Child) {
    if (!editName.trim()) return;
    await onUpdateChild(child.id, { name: editName.trim() });
    setEditingId(null);
    setEditName("");
  }

  async function handlePhotoChange(childId: string, avatar: string) {
    return onUpdateChild(childId, { avatar });
  }

  if (classes.length === 0) {
    return (
      <section className="teacher-panel card-warm rounded-3xl p-4">
        <div className="teacher-panel-head">
          <p className="teacher-panel-title">👶 원아 관리</p>
        </div>
        <p className="teacher-panel-empty mt-2">반을 먼저 추가한 뒤 원아를 등록할 수 있어요.</p>
      </section>
    );
  }

  return (
    <section className="teacher-panel card-warm rounded-3xl p-4">
      <div className="teacher-panel-head">
        <p className="teacher-panel-title">👶 원아 관리</p>
        <p className="teacher-panel-desc">반 선택 → 이름 입력 → 사진 변경</p>
      </div>

      <div className="teacher-class-chips mt-3">
        {classes.map((cls) => (
          <button
            key={cls.id}
            type="button"
            onClick={() => setSelectedClass(cls.name)}
            className={`teacher-class-chip tap-scale ${selectedClass === cls.name ? "active" : ""}`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      <div className="teacher-inline-form mt-3">
        <input
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="원아 이름"
          className="input-warm teacher-inline-input flex-1 px-3 py-2.5 text-sm"
          onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
        />
        <button
          type="button"
          disabled={loading || !childName.trim()}
          onClick={() => void handleAdd()}
          className="teacher-inline-btn"
        >
          {loading ? "..." : "+ 원아 추가"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {classes.map((cls) => {
          const list = grouped.get(cls.name) ?? [];
          return (
            <div key={cls.id} className="teacher-child-group">
              <p className="teacher-child-group-title">
                {cls.name} <span className="opacity-70">({list.length}명)</span>
              </p>
              {list.length === 0 ? (
                <p className="teacher-panel-empty text-xs">등록된 원아가 없어요</p>
              ) : (
                <ul className="space-y-1.5">
                  {list.map((child) => (
                    <li key={child.id} className="teacher-child-row">
                      <ChildProfileAvatar avatar={child.avatar} name={child.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        {editingId === child.id ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input-warm w-full px-2 py-1.5 text-sm"
                            onKeyDown={(e) => e.key === "Enter" && void saveEdit(child)}
                          />
                        ) : (
                          <>
                            <span className="teacher-child-name block">{child.name}</span>
                            <ChildPhotoChangeButton
                              childId={child.id}
                              childName={child.name}
                              onPhotoChange={handlePhotoChange}
                              compact
                            />
                          </>
                        )}
                      </div>
                      <div className="teacher-child-actions">
                        {editingId === child.id ? (
                          <>
                            <button type="button" onClick={() => void saveEdit(child)} className="teacher-mini-btn primary">
                              저장
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="teacher-mini-btn">
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(child.id);
                                setEditName(child.name);
                              }}
                              className="teacher-mini-btn"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteChild(child.id)}
                              className="teacher-mini-btn danger"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
