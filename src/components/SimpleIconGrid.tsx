import Link from "next/link";

export type SimpleIconItem = {
  href?: string;
  emoji: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string;
};

type SimpleIconGridProps = {
  items: SimpleIconItem[];
  columns?: 2 | 4;
  className?: string;
};

export function SimpleIconGrid({ items, columns = 4, className = "" }: SimpleIconGridProps) {
  const gridClass = columns === 2 ? "simple-icon-grid-2" : "simple-icon-grid-4";

  return (
    <div className={`simple-icon-grid ${gridClass} ${className}`.trim()}>
      {items.map((item) => {
        const content = (
          <>
            <span className="simple-icon-emoji" aria-hidden>
              {item.emoji}
            </span>
            <span className="simple-icon-label">{item.label}</span>
            {item.badge && <span className="simple-icon-badge">{item.badge}</span>}
          </>
        );

        const itemClass = `simple-icon-item tap-scale ${item.active ? "active" : ""}`;

        if (item.href) {
          return (
            <Link key={item.label} href={item.href} className={itemClass}>
              {content}
            </Link>
          );
        }

        return (
          <button key={item.label} type="button" onClick={item.onClick} className={itemClass}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
