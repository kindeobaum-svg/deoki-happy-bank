"use client";

export type TeacherSection = "invite" | "missions" | "deposit" | "classes";

type TeacherSectionMenuProps = {
  active: TeacherSection | null;
  onSelect: (section: TeacherSection) => void;
};

const ITEMS: { id: TeacherSection; emoji: string; label: string }[] = [
  { id: "invite", emoji: "💌", label: "학부모 초대" },
  { id: "missions", emoji: "🎯", label: "미션 확인" },
  { id: "deposit", emoji: "💰", label: "통장 입금" },
  { id: "classes", emoji: "🏫", label: "반 관리" },
];

export function TeacherSectionMenu({ active, onSelect }: TeacherSectionMenuProps) {
  return (
    <nav className="teacher-menu-grid" aria-label="교사 메뉴">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={`teacher-menu-item tap-scale ${active === item.id ? "active" : ""}`}
          aria-pressed={active === item.id}
        >
          <span className="teacher-menu-emoji" aria-hidden>
            {item.emoji}
          </span>
          <span className="teacher-menu-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export const TEACHER_SECTION_LABELS: Record<TeacherSection, string> = {
  invite: "학부모 초대",
  missions: "미션 확인",
  deposit: "통장 입금",
  classes: "반 관리",
};
