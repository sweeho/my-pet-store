import { AdminShell, Button, RequireAdmin } from "@/components";

export function AdminHomeContent() {
  const navigate = useNavigate();

  async function handleLogout() {
    await fetch("/api/signon/logout", { method: "POST" });
    navigate("/");
  }

  return (
    <AdminShell>
      <h1 className="text-foreground text-2xl font-bold">Administration</h1>
      <p className="text-muted-foreground mt-3 max-w-[38rem] text-sm leading-6">
        The administration client manages orders and gives visibility of sales across the catalog.
      </p>

      <ul className="mt-4 flex max-w-[38rem] flex-col gap-2">
        <li className="flex gap-2.5 text-sm leading-6">
          <span
            aria-hidden="true"
            className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
          />
          Review approved, completed and denied orders.
        </li>
        <li className="flex gap-2.5 text-sm leading-6">
          <span
            aria-hidden="true"
            className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
          />
          Approve or deny pending orders, several at a time.
        </li>
        <li className="flex gap-2.5 text-sm leading-6">
          <span
            aria-hidden="true"
            className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
          />
          Report revenue by category over a date range.
        </li>
        <li className="flex gap-2.5 text-sm leading-6">
          <span
            aria-hidden="true"
            className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
          />
          Report order counts by category over a date range.
        </li>
      </ul>

      <div className="mt-8 flex items-center gap-3">
        <Button type="button" onClick={() => navigate("/admin/orders")}>
          Launch Rich Client
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate("/admin/orders-approval")}>
          Review Pending Orders
        </Button>
        <Button type="button" variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="border-border bg-secondary mt-10 max-w-[38rem] rounded-lg border px-5 py-4">
        <p className="text-muted-foreground text-sm">
          Your session ends after 54 minutes without activity. Signing out ends it immediately.
        </p>
      </div>
    </AdminShell>
  );
}

export default function AdminHome() {
  return (
    <RequireAdmin>
      <AdminHomeContent />
    </RequireAdmin>
  );
}
