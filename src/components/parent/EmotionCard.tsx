import Link from "next/link";

type EmotionCardProps = {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  badge?: string;
  variant?: "default" | "peach";
};

export function EmotionCard({
  href,
  emoji,
  title,
  desc,
  badge,
  variant = "default",
}: EmotionCardProps) {
  return (
    <Link
      href={href}
      className={`forest-action-card ${variant === "peach" ? "card-peach" : ""}`}
    >
      <span className="forest-action-emoji float-gentle">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="font-title text-base text-[var(--forest-deep)] mobile-card-text">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-[var(--ink-soft)] mobile-card-text">{desc}</p>
      </div>
      {badge ? (
        <span className="forest-action-badge">{badge}</span>
      ) : (
        <span className="text-lg text-[var(--sage-400)]">→</span>
      )}
    </Link>
  );
}

type StatBubbleProps = {
  label: string;
  value: string;
  emoji: string;
  variant?: "green" | "gold" | "peach";
};

export function StatBubble({ label, value, emoji, variant = "green" }: StatBubbleProps) {
  const variantClass =
    variant === "gold" ? "stat-gold" : variant === "peach" ? "stat-peach" : "stat-green";

  return (
    <div className={`forest-stat-card ${variantClass}`}>
      <span className="forest-stat-emoji">{emoji}</span>
      <p className="forest-stat-value">{value}</p>
      <p className="forest-stat-label">{label}</p>
    </div>
  );
}
