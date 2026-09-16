import { AdminShell, ReportBars, RequireAdmin } from "@/components";

import type { Report } from "../../../../admin/types";

type SessionInfo = { j_signon_username: string | null };

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(value: number): string {
  return CURRENCY_FORMAT.format(value);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toIsoDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// The API takes MM/dd/yyyy (admin/reports.ts's parseReportDates); the native
// date input works in yyyy-MM-dd. Converting here, not in the API, keeps the
// date format a screen concern the same way PLAN.md step 4 keeps currency
// and date display a screen concern.
function isoDateToMDY(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}

function defaultStartDate(): string {
  return toIsoDateInput(new Date(Date.now() - 30 * DAY_MS));
}

function defaultEndDate(): string {
  return toIsoDateInput(new Date());
}

function isReport(result: unknown): result is Report {
  return typeof result === "object" && result !== null && "rows" in result;
}

export function RevenueReportContent() {
  const [username, setUsername] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/signon/session")
      .then((response) => response.json() as Promise<SessionInfo>)
      .then((session) => {
        if (!cancelled) setUsername(session.j_signon_username);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The date range lives in this screen's state and is applied to every
  // subsequent query — the observable outcome the two chart scenarios
  // assert (PLAN.md step 7).
  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({
      start: isoDateToMDY(startDate),
      end: isoDateToMDY(endDate),
    });

    fetch(`/api/admin/reports/revenue?${params.toString()}`)
      .then((response) => response.json() as Promise<unknown>)
      .then((result) => {
        if (cancelled) return;
        if (isReport(result)) setReport(result);
      });

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return (
    <AdminShell username={username} backTo="/admin" backLabel="Back to admin home">
      <h1 className="text-foreground mt-4 text-2xl font-bold">Revenue by Category</h1>
      <p className="text-muted-foreground mt-1.5 text-sm">
        Total sales by category over a date range.
      </p>

      <div className="mt-5 flex items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="revenue-start" className="text-foreground text-sm font-medium">
            Start date
          </label>
          <input
            id="revenue-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="revenue-end" className="text-foreground text-sm font-medium">
            End date
          </label>
          <input
            id="revenue-end"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {report === null ? (
        <p role="status" className="text-muted-foreground mt-6 text-sm">
          Loading report…
        </p>
      ) : report.rows.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">No sales in that range.</p>
      ) : (
        <div className="mt-6">
          <ReportBars rows={report.rows} formatValue={formatCurrency} />
          <p className="text-foreground mt-4 text-sm font-medium">
            Total: {formatCurrency(report.totalSales)}
          </p>
        </div>
      )}
    </AdminShell>
  );
}

export default function AdminRevenueReport() {
  return (
    <RequireAdmin>
      <RevenueReportContent />
    </RequireAdmin>
  );
}
