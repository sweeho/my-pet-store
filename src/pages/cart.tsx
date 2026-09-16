import { Link } from "react-router";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";

import type { Cart } from "../../cart/types";

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/cart")
      .then((response) => response.json() as Promise<Cart>)
      .then((result) => {
        if (!cancelled) setCart(result);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <Link to="/catalog" className="text-muted-foreground text-sm hover:underline">
        ← Continue shopping
      </Link>
      <h1 className="text-foreground mt-2 text-xl font-bold">Shopping Cart</h1>

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
                      defaultValue={item.quantity}
                      aria-label={`Quantity for ${item.itemId}`}
                      className="border-input bg-background text-foreground w-[72px] rounded-md border px-2.5 py-2 text-sm tabular-nums"
                    />
                  </TableCell>
                  <TableCell className="text-foreground text-right font-medium whitespace-nowrap tabular-nums">
                    {formatCurrency(item.lineTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="submit"
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
            <Button type="submit">Update Cart</Button>
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
