"use client";

import type { PassbookSummary } from "@/lib/localPassbook";

type PassbookSummaryCardProps = {
  summary: PassbookSummary;
  childName?: string;
};

export function PassbookSummaryCard({ summary, childName }: PassbookSummaryCardProps) {
  return (
    <section className="passbook-summary-card" aria-label="통장 요약">
      {childName && (
        <p className="passbook-summary-greeting">
          <span className="passbook-summary-star" aria-hidden>★</span>
          {childName}의 행복숲 통장
        </p>
      )}
      <div className="passbook-summary-grid passbook-summary-grid-2">
        <div className="passbook-summary-item">
          <p className="passbook-summary-label">총 적립</p>
          <p className="passbook-summary-value deposit">
            +{summary.totalDeposits.toLocaleString()}
            <span className="passbook-summary-unit">원</span>
          </p>
        </div>
        <div className="passbook-summary-divider" aria-hidden />
        <div className="passbook-summary-item highlight">
          <p className="passbook-summary-label">현재 잔액</p>
          <p className="passbook-summary-value balance">
            {summary.balance.toLocaleString()}
            <span className="passbook-summary-unit">원</span>
          </p>
        </div>
      </div>
    </section>
  );
}
