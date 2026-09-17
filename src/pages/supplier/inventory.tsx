import type { FormEvent } from "react";

import {
  AdminShell,
  Button,
  RequireAdmin,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";

import type { InventoryRow, InventoryUpdate } from "../../../fulfillment/types";

// Same shared class string src/pages/customer.tsx uses — there is no input
// primitive in src/components/ui/ and none is added here (F8).
const inputClassName =
  "border-input bg-background text-foreground w-24 rounded-md border px-3 py-2 text-right text-sm";

type RowState = { newQuantity: string; checked: boolean };

function isInventoryList(result: unknown): result is { items: InventoryRow[] } {
  return typeof result === "object" && result !== null && "items" in result;
}

function isErrorResult(result: unknown): result is { error: string } {
  return typeof result === "object" && result !== null && "error" in result;
}

function initialRows(items: InventoryRow[]): Record<string, RowState> {
  return Object.fromEntries(items.map((row) => [row.itemid, { newQuantity: "", checked: false }]));
}

export function InventoryContent() {
  const [items, setItems] = useState<InventoryRow[] | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/supplier/inventory")
      .then((response) => response.json() as Promise<unknown>)
      .then((result) => {
        if (cancelled) return;
        if (isInventoryList(result)) {
          setItems(result.items);
          setRows(initialRows(result.items));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setRow(itemid: string, patch: Partial<RowState>) {
    setRows((current) => ({ ...current, [itemid]: { ...current[itemid], ...patch } }));
  }

  // Re-reads the list after a successful write (PLAN.md step 6) so
  // Existing quantity shows what was actually stored rather than what was
  // typed, and resets every row's control for the next edit.
  async function refreshInventory() {
    const response = await fetch("/api/supplier/inventory");
    const result = (await response.json()) as unknown;
    if (isInventoryList(result)) {
      setItems(result.items);
      setRows(initialRows(result.items));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    // Only ticked rows are written (D9, AC-5) — a typed value in an
    // unticked row never leaves the browser.
    const updates: InventoryUpdate[] = Object.entries(rows)
      .filter(([, row]) => row.checked)
      .map(([itemid, row]) => ({ itemid, quantity: Number(row.newQuantity) }));

    if (updates.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/supplier/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const result = (await response.json()) as unknown;

      if (!response.ok) {
        setSubmitError(isErrorResult(result) ? result.error : "Inventory update failed.");
        return;
      }

      await refreshInventory();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminShell backTo="/supplier" backLabel="Back to supplier home">
      <h1 className="text-foreground text-2xl font-bold">Inventory</h1>
      <p className="text-muted-foreground mt-1.5 text-sm">
        Enter a new quantity and tick Update for every item you want to change, then submit the
        form.
      </p>

      {items === null ? (
        <p role="status" className="text-muted-foreground mt-6 text-sm">
          Loading inventory…
        </p>
      ) : (
        <>
          {submitError && (
            <p role="alert" className="text-destructive mt-4 text-sm">
              {submitError}
            </p>
          )}
          <form aria-label="Update inventory" onSubmit={handleSubmit} className="mt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Item ID</TableHead>
                  <TableHead scope="col" className="text-right">
                    Existing quantity
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    New quantity
                  </TableHead>
                  <TableHead scope="col" className="text-center">
                    Update
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.itemid}>
                    <TableCell className="font-medium">{row.itemid}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                    <TableCell className="text-right">
                      <input
                        type="text"
                        aria-label={`New quantity for ${row.itemid}`}
                        placeholder={String(row.quantity)}
                        value={rows[row.itemid]?.newQuantity ?? ""}
                        onChange={(event) =>
                          setRow(row.itemid, { newQuantity: event.target.value })
                        }
                        className={inputClassName}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        aria-label={`Update ${row.itemid}`}
                        checked={rows[row.itemid]?.checked ?? false}
                        onChange={(event) => setRow(row.itemid, { checked: event.target.checked })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                Only ticked rows are updated. Every other row keeps its existing quantity.
              </p>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating…" : "Update Inventory"}
              </Button>
            </div>
            {submitting && (
              <p role="status" className="text-muted-foreground mt-2 text-sm">
                Updating inventory…
              </p>
            )}
          </form>
        </>
      )}
    </AdminShell>
  );
}

export default function SupplierInventory() {
  return (
    <RequireAdmin>
      <InventoryContent />
    </RequireAdmin>
  );
}
