import {
  AdminShell,
  Button,
  RequireAdmin,
  StatusSelect,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";

import type { ApprovalDecision } from "../../../order/approval-types";
import type { OrderStatus, OrderSummary, Page } from "../../../admin/types";

type SessionInfo = { j_signon_username: string | null };

// The fixed request/response shape SWHM-T-0211's route already carries
// (PLAN.md's Fixed interface contracts) — restated locally rather than
// imported across the src/ boundary from admin/order-status.ts, which no
// other client-side file does.
type OrderDecision = { orderId: number; status: ApprovalDecision };
type DecisionBatchResult = { applied: number[]; skipped: number[]; notFound: number[] };

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// English/US throughout, hardcoded rather than locale-aware (PRODUCT.md §
// Scope) — formatting is this screen's job, not the API's (PLAN.md step 4),
// mirroring src/pages/admin/orders.tsx's own formatters.
function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${date.getUTCFullYear()}`;
}

function formatOrderAmount(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}

function isOrdersPage(result: unknown): result is Page<OrderSummary> {
  return typeof result === "object" && result !== null && "items" in result;
}

function isErrorResult(result: unknown): result is { error: string } {
  return typeof result === "object" && result !== null && "error" in result;
}

function isDecisionBatchResult(result: unknown): result is DecisionBatchResult {
  return typeof result === "object" && result !== null && "applied" in result;
}

// The response's `skipped` list is a real outcome a reader must see — an
// order someone else already decided comes back skipped, and silently
// dropping it leaves the reader believing they approved something they did
// not (design.md § Decisions D3, D7; PLAN.md step 7).
function describeCommitOutcome(result: DecisionBatchResult): string {
  const parts: string[] = [];
  if (result.applied.length > 0) {
    parts.push(`${result.applied.length} order${result.applied.length === 1 ? "" : "s"} updated`);
  }
  if (result.skipped.length > 0) {
    parts.push(
      `${result.skipped.length} order${result.skipped.length === 1 ? "" : "s"} already decided by someone else and skipped`,
    );
  }
  if (result.notFound.length > 0) {
    parts.push(
      `${result.notFound.length} order${result.notFound.length === 1 ? "" : "s"} not found`,
    );
  }
  return parts.length > 0 ? `${parts.join(". ")}.` : "No changes were committed.";
}

// A second screen beside the read-only /admin/orders, not a mode on it
// (design.md § Decisions D8). This is the last ticket in the sprint: the
// table and per-row control (SWHM-T-0208), the colour tokens (SWHM-T-0209)
// and now selection, bulk Approve/Deny, and Commit.
export function OrdersApprovalContent() {
  const [username, setUsername] = useState<string | null>(null);
  const [page, setPage] = useState<Page<OrderSummary> | null>(null);
  const [statusChoices, setStatusChoices] = useState<Record<number, OrderStatus>>({});
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    // The endpoint already exists and already serves PENDING; nothing is
    // added to it (PLAN.md step 3).
    fetch("/api/admin/orders?status=PENDING")
      .then((response) => response.json() as Promise<unknown>)
      .then((result) => {
        if (cancelled) return;
        if (isOrdersPage(result)) {
          setPage(result);
          setStatusChoices(
            Object.fromEntries(result.items.map((order) => [order.orderId, order.orderStatus])),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Called only from handleCommit below, never from an effect body, so a
  // successful commit can re-fetch the same list (PLAN.md step 7) —
  // decided orders leave the pending view once the server has actually
  // recorded the decision, not optimistically.
  async function refreshPendingOrders() {
    const response = await fetch("/api/admin/orders?status=PENDING");
    const result = (await response.json()) as unknown;
    if (isOrdersPage(result)) {
      setPage(result);
      setStatusChoices(
        Object.fromEntries(result.items.map((order) => [order.orderId, order.orderStatus])),
      );
      setSelected({});
    }
  }

  const items = page?.items ?? [];
  const selectedCount = items.filter((order) => selected[order.orderId]).length;
  const uncommittedCount = items.filter(
    (order) => statusChoices[order.orderId] !== order.orderStatus,
  ).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  // Selection and editing are separate controls, and selection decides
  // what is written (PLAN.md step 2, D3/D7) — a status changed in an
  // unticked row is not committed, because inferring intent from whether a
  // control was touched cannot tell "I changed my mind" from "I meant it".
  const decisionsToCommit: OrderDecision[] = items
    .filter((order) => selected[order.orderId] && statusChoices[order.orderId] !== "PENDING")
    .map((order) => ({
      orderId: order.orderId,
      status: statusChoices[order.orderId] as ApprovalDecision,
    }));

  function toggleSelectAll(checked: boolean) {
    setSelected(Object.fromEntries(items.map((order) => [order.orderId, checked])));
  }

  function toggleSelected(orderId: number, checked: boolean) {
    setSelected((current) => ({ ...current, [orderId]: checked }));
  }

  // Approve/Deny change local state only — nothing reaches the server
  // until Commit (PLAN.md step 3).
  function applyBulkStatus(next: ApprovalDecision) {
    setStatusChoices((current) => {
      const updated = { ...current };
      for (const order of items) {
        if (selected[order.orderId]) {
          updated[order.orderId] = next;
        }
      }
      return updated;
    });
  }

  // Commit is a pending action: disabled from the press until the outcome
  // is known, with a present-participle label and a role="status" region
  // naming what is happening (PLAN.md step 6) — a disabled control still
  // carrying its original label reads as refused rather than busy. The
  // guarded path is this endpoint, never POST /api/admin/orders/status,
  // which applies no status guard (S11).
  async function handleCommit() {
    if (decisionsToCommit.length === 0) return;

    setCommitting(true);
    setCommitMessage(null);
    try {
      const response = await fetch("/api/admin/orders/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions: decisionsToCommit }),
      });
      const result = (await response.json()) as unknown;

      if (!response.ok) {
        setCommitMessage(isErrorResult(result) ? result.error : "Commit failed.");
        return;
      }

      if (isDecisionBatchResult(result)) {
        setCommitMessage(describeCommitOutcome(result));
      }

      await refreshPendingOrders();
    } finally {
      setCommitting(false);
    }
  }

  return (
    <AdminShell username={username} backTo="/admin" backLabel="Back to admin home">
      <div className="mt-4">
        <h1 className="text-foreground text-2xl font-bold">Orders Approval</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Orders above the auto-approval threshold for their locale.
        </p>
      </div>

      {page === null ? (
        <p role="status" className="text-muted-foreground mt-6 text-sm">
          Loading orders…
        </p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">No pending orders awaiting review.</p>
      ) : (
        <>
          {commitMessage && (
            <p role="alert" className="text-foreground mt-4 text-sm">
              {commitMessage}
            </p>
          )}
          <Table className="mt-5">
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="w-[6%]">
                  <input
                    type="checkbox"
                    aria-label="Select all orders"
                    checked={allSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                </TableHead>
                <TableHead scope="col" className="w-[12%]">
                  Order ID
                </TableHead>
                <TableHead scope="col" className="w-[24%]">
                  User ID
                </TableHead>
                <TableHead scope="col" className="w-[16%]">
                  Order Date
                </TableHead>
                <TableHead scope="col" className="w-[18%] text-right">
                  Order Amount
                </TableHead>
                <TableHead scope="col" className="w-[24%]">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Select order ${order.orderId}`}
                      checked={selected[order.orderId] ?? false}
                      onChange={(event) => toggleSelected(order.orderId, event.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="tabular-nums">{order.orderId}</TableCell>
                  <TableCell>{order.userId}</TableCell>
                  <TableCell className="tabular-nums">{formatOrderDate(order.orderDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatOrderAmount(order.orderAmount)}
                  </TableCell>
                  <TableCell>
                    <StatusSelect
                      value={statusChoices[order.orderId] ?? order.orderStatus}
                      orderId={order.orderId}
                      onChange={(next) =>
                        setStatusChoices((choices) => ({ ...choices, [order.orderId]: next }))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Three controls outside the table, after it, with the selection
              summary beside them (PLAN.md step 5, mockup .actions) — one
              control writes the selected rows together; a per-row save
              would turn one intention into many actions with nothing
              showing what is still outstanding. */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              {selectedCount} selected &middot; {uncommittedCount} uncommitted changes
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => applyBulkStatus("APPROVED")}>
                Approve
              </Button>
              <Button type="button" variant="destructive" onClick={() => applyBulkStatus("DENIED")}>
                Deny
              </Button>
              <Button
                type="button"
                onClick={handleCommit}
                disabled={committing || decisionsToCommit.length === 0}
              >
                {committing ? "Committing…" : "Commit"}
              </Button>
            </div>
          </div>
          {committing && (
            <p role="status" className="text-muted-foreground mt-2 text-sm">
              Committing changes…
            </p>
          )}

          <p className="text-muted-foreground mt-4 text-sm">
            Commit sends every changed status to the server. Approved orders generate a supplier
            purchase order; both approvals and denials notify the customer.
          </p>
        </>
      )}
    </AdminShell>
  );
}

export default function AdminOrdersApproval() {
  return (
    <RequireAdmin>
      <OrdersApprovalContent />
    </RequireAdmin>
  );
}
