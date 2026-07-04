import { EmotionCard } from "@/components/parent/EmotionCard";

type QuickNavItem = {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  variant?: "default" | "peach";
};

type RoleQuickNavProps = {
  items: QuickNavItem[];
  className?: string;
};

/** 역할별 주요 기능 바로가기 — 기존 EmotionCard 디자인 유지 */
export function RoleQuickNav({ items, className = "" }: RoleQuickNavProps) {
  return (
    <section className={`space-y-2.5 ${className}`.trim()}>
      {items.map((item) => (
        <EmotionCard key={`${item.href}-${item.title}`} {...item} />
      ))}
    </section>
  );
}
