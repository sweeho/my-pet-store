import type { ReportRow } from "../../admin/types";

type ReportBarsProps = {
  rows: ReportRow[];
  formatValue: (value: number) => string;
};

// Presentational only — props in, no fetching (PLAN.md step 6). Reused by
// SWHM-T-0121 for order counts, so it stays agnostic about whether a row's
// value is money or a count by taking a formatter rather than assuming one.
// Drawn from existing tokens in CSS; no charting dependency is added (S10).
export function ReportBars({ rows, formatValue }: ReportBarsProps) {
  const maxValue = rows.length > 0 ? Math.max(...rows.map((row) => row.value)) : 0;

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const widthPercent = maxValue > 0 ? (row.value / maxValue) * 100 : 0;
        return (
          <li key={row.id} className="flex items-center gap-3">
            <span className="text-foreground w-40 shrink-0 truncate text-sm">{row.label}</span>
            <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
              <div
                data-testid={`report-bar-${row.id}`}
                aria-hidden="true"
                className="bg-primary h-2 rounded-full"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            <span className="text-muted-foreground w-28 shrink-0 text-right text-sm tabular-nums">
              {formatValue(row.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
