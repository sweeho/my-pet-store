import { Link, useLocation } from "react-router";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";

import { EMPTY_CART_MESSAGE } from "../../order/errors";
import type { Cart } from "../../cart/types";

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}

// Keyed by itemId so an edited-but-not-yet-submitted quantity survives a
// re-render without round-tripping through the server (PLAN.md step 1).
function quantitiesFrom(cart: Cart): Record<string, string> {
  return Object.fromEntries(cart.items.map((item) => [item.itemId, String(item.quantity)]));
}

export default function CartPage() {
  const location = useLocation();
  // Set only by a redirect from the order form's own empty-cart refusal
  // (SWHM-T-0161) — a distinct message from the empty-state copy below, so
  // it renders as its own alert rather than reworded into that copy
  // (PLAN.md step 5).
  const emptyCartNotice = (location.state as { emptyCart?: boolean } | null)?.emptyCart === true;

  const [cart, setCart] = useState<Cart | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    fetch("/api/cart")
      .then((response) => response.json() as Promise<Cart>)
      .then((result) => {
        if (cancelled) return;
        setCart(result);
        setQuantities(quantitiesFrom(result));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleQuantityChange(itemId: string, value: string) {
    setQuantities((prev) => ({ ...prev, [itemId]: value }));
  }

  async function handleUpdateCart() {
    if (!cart) return;

    // <input type="number">'s value sanitization (browser and jsdom alike)
    // never delivers a non-numeric string via onChange — an invalid entry
    // is already collapsed to "". So "empty" and "not a number" (spec
    // discrepancy S13) are one observable case here: an empty field.
    const nextErrors: Record<string, string> = {};
    const updates: { itemId: string; quantity: number }[] = [];

    for (const item of cart.items) {
      const raw = (quantities[item.itemId] ?? String(item.quantity)).trim();
      if (raw === "" || !Number.isFinite(Number(raw))) {
        nextErrors[item.itemId] = `Quantity for ${item.productName} must be a number.`;
        continue;
      }
      updates.push({ itemId: item.itemId, quantity: Number(raw) });
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const response = await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    const result = (await response.json()) as Cart;
    setCart(result);
    setQuantities(quantitiesFrom(result));
    setErrors({});
  }

  async function handleRemove(itemId: string) {
    const response = await fetch(`/api/cart/items/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as Cart;
    setCart(result);
    setQuantities(quantitiesFrom(result));
    setErrors({});
  }

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <Link to="/catalog" className="text-muted-foreground text-sm hover:underline">
        ← Continue shopping
      </Link>
      <h1 className="text-foreground mt-2 text-xl font-bold">Shopping Cart</h1>

      {emptyCartNotice && (
        <p
          role="alert"
          className="border-destructive bg-background text-destructive mt-3 rounded-md border px-3 py-2 text-sm"
        >
          {EMPTY_CART_MESSAGE}
        </p>
      )}

      {cart === null ? (
        <p role="status" className="text-muted-foreground mt-6 text-sm">
          Loading cart…
        </p>
      ) : cart.count === 0 ? (
        <div className="border-border mt-6 rounded-[10px] border px-6 py-12 text-center">
          <p className="text-foreground text-base font-medium">Your Shopping Cart is Empty.</p>
          <p className="text-muted-foreground mx-auto mt-1.5 max-w-[380px] text-sm">
            Items you add while browsing the catalog will appear here for the rest of your visit.
          </p>
          <Button asChild className="mt-6">
            <Link to="/catalog">Browse the catalog</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mt-1 text-sm">
            {cart.count} {cart.count === 1 ? "item" : "items"} in your cart
          </p>

          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Item</TableHead>
                <TableHead scope="col" className="text-right">
                  Unit Cost
                </TableHead>
                <TableHead scope="col">Quantity</TableHead>
                <TableHead scope="col" className="text-right">
                  Line Total
                </TableHead>
                <TableHead scope="col" className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.items.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell>
                    <div className="text-foreground font-medium">{item.productName}</div>
                    <div className="text-muted-foreground mt-0.5 text-[13px]">
                      {item.description}
                    </div>
                    <div className="text-muted-foreground mt-1.5 font-mono text-[11px]">
                      {item.itemId}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatCurrency(item.unitCost)}
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min={0}
                      value={quantities[item.itemId] ?? String(item.quantity)}
                      onChange={(event) => handleQuantityChange(item.itemId, event.target.value)}
                      aria-label={`Quantity for ${item.itemId}`}
                      className="border-input bg-background text-foreground w-[72px] rounded-md border px-2.5 py-2 text-sm tabular-nums"
                    />
                    {errors[item.itemId] && (
                      <p role="alert" className="text-destructive mt-1 text-xs">
                        {errors[item.itemId]}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground text-right font-medium whitespace-nowrap tabular-nums">
                    {formatCurrency(item.lineTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="submit"
                      onClick={() => handleRemove(item.itemId)}
                      className="text-foreground text-sm font-medium hover:underline"
                    >
                      Remove
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex items-start justify-between gap-6">
            <div className="flex gap-2">
              <Button type="submit" onClick={handleUpdateCart}>
                Update Cart
              </Button>
              <Button asChild variant="outline">
                <Link to="/enter-order-information">Proceed to Checkout</Link>
              </Button>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-6">
                <span className="text-muted-foreground text-sm">Subtotal</span>
                <span className="text-xl font-bold tabular-nums">
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Sum of unit cost × quantity for all items.
              </p>
            </div>
          </div>

          <p className="text-muted-foreground mt-4 text-xs">
            Set a quantity to 0 and choose Update Cart to remove an item.
          </p>
        </>
      )}
    </div>
  );
}
