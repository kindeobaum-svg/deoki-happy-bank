export type GrowthLedgerEntry = {
  id: string;
  date: string;
  label: string;
  amount: number;
  cumulative: number;
  childName?: string;
};

type PassbookLedgerProps = {
  entries: GrowthLedgerEntry[];
  emptyMessage?: string;
  showChildName?: boolean;
};

const STAMP_EMOJI = ["✨", "🌱", "💚", "⭐", "🌸", "🍀"];

function stampForIndex(i: number) {
  return STAMP_EMOJI[i % STAMP_EMOJI.length];
}

export function PassbookLedger({
  entries,
  emptyMessage = "아직 적립된 행복이 없어요.\n첫 번째 씨앗을 기다리고 있어요.",
  showChildName = false,
}: PassbookLedgerProps) {
  if (entries.length === 0) {
    return (
      <div className="passbook-empty py-10 text-center">
        <p className="float-gentle text-4xl">📒</p>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-soft)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <ol className="passbook-ledger space-y-0">
      {entries.map((entry, i) => (
        <li key={entry.id} className="passbook-ledger-row">
          <div className="passbook-ledger-stamp" aria-hidden>
            {stampForIndex(i)}
          </div>
          <div className="passbook-ledger-content min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <time className="passbook-ledger-date font-mono text-xs text-[var(--sage-600)]">
                {entry.date}
              </time>
              <span className="passbook-ledger-amount shrink-0 font-display text-base font-bold text-[var(--sage-600)]">
                +{entry.amount.toLocaleString()}
              </span>
            </div>
            <p className="passbook-ledger-label mt-1 font-display text-[15px] leading-snug text-[var(--ink)]">
              {entry.label}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--ink-soft)]">
              {showChildName && entry.childName && (
                <span className="rounded-full bg-[var(--peach-soft)] px-2 py-0.5">
                  {entry.childName}
                </span>
              )}
              <span>
                누적 <strong className="text-[var(--sage-800)]">{entry.cumulative.toLocaleString()}</strong>
                원
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PassbookBalance({
  total,
  subtitle,
}: {
  total: number;
  subtitle?: string;
}) {
  return (
    <div className="passbook-balance mb-5 text-center">
      <p className="text-xs tracking-wide text-[var(--ink-soft)]">지금까지 모은 행복</p>
      <p className="passbook-balance-amount mt-1 font-display text-3xl font-bold text-[var(--sage-800)]">
        {total.toLocaleString()}
        <span className="ml-0.5 text-lg font-semibold">원</span>
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-[var(--ink-soft)]">{subtitle}</p>
      )}
    </div>
  );
}

export function PassbookAccountHeader({
  childAvatar,
  childName,
  accountNumber,
  className,
}: {
  childAvatar: string;
  childName: string;
  accountNumber?: string;
  className?: string;
}) {
  return (
    <div className={`passbook-account-header mb-4 flex items-center gap-3 border-b border-dashed border-[var(--sage-200)] pb-4 ${className ?? ""}`}>
      <span className="passbook-avatar-badge text-3xl">{childAvatar}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold text-[var(--sage-800)]">{childName}</p>
        {accountNumber && (
          <p className="mt-0.5 font-mono text-[10px] tracking-wider text-[var(--ink-soft)]">
            NO. {accountNumber}
          </p>
        )}
      </div>
      <span className="passbook-seal shrink-0 text-xs" aria-hidden>
        성장
        <br />
        중
      </span>
    </div>
  );
}
