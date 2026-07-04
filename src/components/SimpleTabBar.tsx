"use client";

export type SimpleTab = {
  id: string;
  emoji: string;
  label: string;
};

type SimpleTabBarProps = {
  tabs: SimpleTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

/** 화면당 최대 4~5개 아이콘 탭 — 한 번에 하나의 섹션만 표시 */
export function SimpleTabBar({ tabs, activeId, onChange, className = "" }: SimpleTabBarProps) {
  return (
    <div className={`simple-tab-bar ${className}`.trim()} role="tablist" aria-label="메뉴">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`simple-tab-item tap-scale ${active ? "active" : ""}`}
          >
            <span className="simple-tab-emoji" aria-hidden>
              {tab.emoji}
            </span>
            <span className="simple-tab-label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
