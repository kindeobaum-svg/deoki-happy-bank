type PageHeaderProps = {
  badge: string;
  title: string;
  subtitle?: string;
};

export function PageHeader({ badge, title, subtitle }: PageHeaderProps) {
  return (
    <header className="simple-staff-hero">
      <p className="simple-staff-badge">{badge}</p>
      <h1 className="simple-staff-title">{title}</h1>
      {subtitle && <p className="simple-staff-sub">{subtitle}</p>}
    </header>
  );
}
