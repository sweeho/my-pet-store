import { AdminShell, Button, RequireAdmin } from "@/components";

export function SupplierHomeContent() {
  const navigate = useNavigate();

  async function handleLogout() {
    await fetch("/api/signon/logout", { method: "POST" });
    navigate("/");
  }

  return (
    <AdminShell>
      <h1 className="text-foreground text-2xl font-bold">Supplier</h1>
      <p className="text-muted-foreground mt-3 max-w-[38rem] text-sm leading-6">
        This module receives purchase orders from the store, checks each line item against stock,
        ships what is available, and returns an invoice for the items that shipped.
      </p>

      <div className="border-border bg-card mt-4 max-w-[38rem] rounded-lg border p-4">
        <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          What this module does
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          <li className="flex gap-2.5 text-sm leading-6">
            <span
              aria-hidden="true"
              className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            />
            Receives purchase orders from the store as customers place them.
          </li>
          <li className="flex gap-2.5 text-sm leading-6">
            <span
              aria-hidden="true"
              className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            />
            Checks every line item against inventory before anything ships.
          </li>
          <li className="flex gap-2.5 text-sm leading-6">
            <span
              aria-hidden="true"
              className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            />
            Ships the available quantity and deducts it from inventory.
          </li>
          <li className="flex gap-2.5 text-sm leading-6">
            <span
              aria-hidden="true"
              className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            />
            Leaves an order pending until every line item has shipped, then marks it completed.
          </li>
          <li className="flex gap-2.5 text-sm leading-6">
            <span
              aria-hidden="true"
              className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            />
            Returns an invoice listing the items shipped, their quantities and unit prices.
          </li>
        </ul>
      </div>

      <div className="border-border bg-card mt-4 max-w-[38rem] rounded-lg border p-4">
        <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          Inventory
        </p>
        <div className="mt-3 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm leading-6">
              Review the quantity held for every item and set new quantities in bulk.
            </p>
            <p className="text-muted-foreground mt-1.5 text-xs">Administrators only.</p>
          </div>
          <Button type="button" onClick={() => navigate("/supplier/inventory")}>
            Display Inventory
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Button type="button" variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </AdminShell>
  );
}

export default function SupplierHome() {
  return (
    <RequireAdmin>
      <SupplierHomeContent />
    </RequireAdmin>
  );
}
