import {
  AdminShell,
  RequireAdmin,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";
import { cn } from "@/utils";

import type { OrderStatus, OrderSummary, Page } from "../../../admin/types";

// The three the requirement names, in one request (PLAN.md step 3). PENDING
// is deliberately excluded here — the API still serves it, and the approval
// workflow that acts on it belongs to swhm-i-0011 (design.md S14).
const SHOWN_STATUSES: OrderStatus[] = ["APPROVED", "COMPLETED", "DENIED"];

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// English/US throughout, hardcoded rather than locale-aware (PRODUCT.md §
// Scope) — formatting is this screen's job, not the API's (PLAN.md step 4).
function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${date.getUTCFullYear()}`;
}

function formatOrderAmount(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}

const STATUS_DOT_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-muted-foreground",
  APPROVED: "bg-foreground",
  COMPLETED: "bg-muted-foreground",
  DENIED: "bg-destructive",
};

const STATUS_TEXT_CLASS: Record<OrderStatus, string> = {
  PENDING: "",
  APPROVED: "",
  COMPLETED: "",
  DENIED: "text-destructive",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "border-border bg-background inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_TEXT_CLASS[status],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_CLASS[status])}
      />
      {status}
    </span>
  );
}

function ordersRequestUrl(): string {
  const params = new URLSearchParams();
  for (const status of SHOWN_STATUSES) {
    params.append("status", status);
  }
  return `/api/admin/orders?${params.toString()}`;
}

function isOrdersPage(result: unknown): result is Page<OrderSummary> {
  return typeof result === "object" && result !== null && "items" in result;
}

export function OrdersContent() {
  const [page, setPage] = useState<Page<OrderSummary> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(ordersRequestUrl())
      .then((response) => response.json() as Promise<unknown>)
      .then((result) => {
        if (cancelled) return;
        if (isOrdersPage(result)) setPage(result);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell backTo="/admin" backLabel="Back to admin home">
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Approved, completed and denied orders. Read-only.
          </p>
        </div>
        {page && <span className="text-muted-foreground text-sm">{page.items.length} orders</span>}
      </div>

      {page === null ? (
        <p role="status" className="text-muted-foreground mt-6 text-sm">
          Loading orders…
        </p>
      ) : page.items.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">
          No approved, completed or denied orders yet.
        </p>
      ) : (
        <Table className="mt-5">
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-[12%]">
                Order ID
              </TableHead>
              <TableHead scope="col" className="w-[28%]">
                User ID
              </TableHead>
              <TableHead scope="col" className="w-[20%]">
                Order Date
              </TableHead>
              <TableHead scope="col" className="w-[20%] text-right">
                Order Amount
              </TableHead>
              <TableHead scope="col" className="w-[18%]">
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
                  <StatusBadge status={order.orderStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </AdminShell>
  );
}

export default function AdminOrders() {
  return (
    <RequireAdmin>
      <OrdersContent />
    </RequireAdmin>
  );
}
