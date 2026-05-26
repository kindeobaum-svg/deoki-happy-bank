import type { ReactNode } from "react";
import { PASSBOOK_NAME, PASSBOOK_TAGLINE, DAYCARE_NAME } from "@/lib/branding";

type PassbookShellProps = {
  children?: ReactNode;
  /** 표지에 보이는 부제 */
  tagline?: string;
  /** 열린 통장 안쪽 (false면 표지만) */
  open?: boolean;
  className?: string;
};

export function PassbookShell({
  children,
  tagline = PASSBOOK_TAGLINE,
  open = true,
  className = "",
}: PassbookShellProps) {
  return (
    <div className={`passbook-book mx-auto max-w-sm ${className}`}>
      <div className="passbook-spine" aria-hidden />
      <div className={open ? "passbook-open" : "passbook-closed"}>
        <div className="passbook-cover-front">
          <div className="passbook-cover-badge">{DAYCARE_NAME}</div>
          <h1 className="passbook-cover-title font-display">
            {PASSBOOK_NAME}
          </h1>
          <p className="passbook-cover-tagline">{tagline}</p>
          <div className="passbook-cover-stamp" aria-hidden>
            🌳
          </div>
          <div className="passbook-cover-lines" aria-hidden />
        </div>
        {open && children && <div className="passbook-inner">{children}</div>}
      </div>
    </div>
  );
}

export function PassbookInnerPage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`passbook-page ruled-paper px-5 py-5 ${className}`}>{children}</div>
  );
}
