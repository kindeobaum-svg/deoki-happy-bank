type PageHeaderProps = {
  badge: string;
  title: string;
  subtitle?: string;
};

export function PageHeader({ badge, title, subtitle }: PageHeaderProps) {
  return (
    <header className="page-header rounded-3xl px-5 py-5">
      <p className="text-xs font-semibold text-green-100">{badge}</p>
      <h1
        className="mt-1 text-2xl font-bold text-white"
        style={{ fontFamily: "var(--font-jua)" }}
      >
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-sm text-green-50">{subtitle}</p>}
    </header>
  );
}
