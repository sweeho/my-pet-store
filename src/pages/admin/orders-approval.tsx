import {
  AdminShell,
  RequireAdmin,
  StatusSelect,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";

import type { OrderStatus, OrderSummary, Page } from "../../../admin/types";

type SessionInfo = { j_signon_username: string | null };

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

// A second screen beside the read-only /admin/orders, not a mode on it
// (design.md § Decisions D8) — this ticket builds the table and the
// per-row status control only; SWHM-T-0209 colours it and SWHM-T-0210
// adds selection and the Approve/Deny/Commit actions.
export function OrdersApprovalContent() {
  const [username, setUsername] = useState<string | null>(null);
  const [page, setPage] = useState<Page<OrderSummary> | null>(null);
  const [statusChoices, setStatusChoices] = useState<Record<number, OrderStatus>>({});

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
      ) : page.items.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">No pending orders awaiting review.</p>
      ) : (
        <Table className="mt-5">
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-[14%]">
                Order ID
              </TableHead>
              <TableHead scope="col" className="w-[26%]">
                User ID
              </TableHead>
              <TableHead scope="col" className="w-[18%]">
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
            {page.items.map((order) => (
              <TableRow key={order.orderId}>
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
