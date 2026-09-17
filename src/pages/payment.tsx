import type { FormEvent } from "react";
import { Link } from "react-router";

import { Button, RequireSignOn, StoreHeader } from "@/components";
import { CONTENT_WIDTH } from "@/components/layout";
import { cn } from "@/utils";

import { CARD_TYPES } from "../../account/vocabulary";
import type { Cart } from "../../cart/types";
import type { OrderAddress } from "../../order/types";
import type { CardSubmission } from "../../payment/types";

const inputClassName =
  "border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm";

// Composed as MM/YYYY for the authorize call, matching the mockup's two
// separate controls over the store's one stored column (design.md § Spec
// discrepancies S9).
const EXPIRY_MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const CURRENT_YEAR = new Date().getFullYear();
const EXPIRY_YEARS = Array.from({ length: 15 }, (_, index) => String(CURRENT_YEAR + index));

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}

// "Visa, MasterCard and American Express are accepted." is the mockup's
// exact phrasing (an Oxford-less "and" before the last item) — a plain
// comma join reads differently, so this mirrors it for this store's own
// CARD_TYPES instead.
function formatAcceptedTypes(types: readonly string[]): string {
  if (types.length < 2) return types.join(", ");
  return `${types.slice(0, -1).join(", ")} and ${types[types.length - 1]}`;
}

// Carried forward by enter-order-information.tsx's submit, already validated
// there against order/validation.ts — this screen never re-validates it,
// only recaps it and forwards it to POST /api/order once authorized
// (design.md § Decisions D6).
type PaymentState = { billingAddress: OrderAddress; shippingAddress: OrderAddress };

function isPaymentState(value: unknown): value is PaymentState {
  return (
    typeof value === "object" &&
    value !== null &&
    "billingAddress" in value &&
    "shippingAddress" in value
  );
}

function emptyCard(): CardSubmission {
  return { cardholderName: "", cardType: "", cardNumber: "", expiryMonth: "", expiryYear: "" };
}

type CardFieldError = { field: keyof CardSubmission; message: string } | null;

type AuthorizeRefusal = { error: string; field: keyof CardSubmission; alert: string };
type AuthorizeOutcome = { status: "approved" | "declined" };

type OrderRefusal = { error: string; emptyCart?: true };
type OrderOutcome = { orderId: number; email: string };

// No literal mockup text exists for a processor decline on an otherwise
// valid card (the mockup's own "State C" is an expired-card *validation*
// refusal — see design.md § Design references and PLAN.md's own
// description of it); this reuses design.md § Decisions D6's own wording
// for that case, through the standing form-level alert pattern.
const DECLINE_ALERT =
  "Payment was not authorized. No order was placed and the card was not charged.";
const ORDER_FAILED_ALERT =
  "There was a problem placing your order. Please go back and check your information.";

function formatAddress(address: OrderAddress): string {
  const line2 = address.streetName2 ? `, ${address.streetName2}` : "";
  return `${address.streetName1}${line2}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
}

export function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = isPaymentState(location.state) ? location.state : null;

  const [cart, setCart] = useState<Cart | null>(null);
  const [card, setCard] = useState<CardSubmission>(emptyCard);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<CardFieldError>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate("/enter-order-information", { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/cart")
      .then((response) => response.json() as Promise<Cart>)
      .then((result) => {
        if (cancelled) return;
        setCart(result);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function update(field: keyof CardSubmission, value: string) {
    setCard((current) => ({ ...current, [field]: value }));
  }

  // Expiry month and year are one conceptual field (design.md S9) — an
  // expiry refusal always names "expiryMonth", and both controls flag it,
  // matching the mockup's State A and State C (both selects carry the error
  // border; the message sits once, beneath the month).
  function invalid(field: keyof CardSubmission): boolean {
    if (field === "expiryYear") return fieldError?.field === "expiryMonth";
    return fieldError?.field === field;
  }

  function fieldClassName(field: keyof CardSubmission): string {
    return invalid(field) ? `${inputClassName} border-destructive` : inputClassName;
  }

  function renderFieldError(field: keyof CardSubmission) {
    if (fieldError?.field !== field) return null;
    return (
      <p role="alert" className="text-destructive text-xs">
        {fieldError.message}
      </p>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state) return;

    setSubmitting(true);
    setFormError(null);
    setFieldError(null);

    const authResponse = await fetch("/api/payment/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });

    if (!authResponse.ok) {
      const refusal = (await authResponse.json()) as AuthorizeRefusal;
      setSubmitting(false);
      setFormError(refusal.alert);
      setFieldError({ field: refusal.field, message: refusal.error });
      return;
    }

    const authResult = (await authResponse.json()) as AuthorizeOutcome;
    if (authResult.status === "declined") {
      setSubmitting(false);
      setFormError(DECLINE_ALERT);
      return;
    }

    // POST /api/order is called only now, after authorization approved the
    // card (design.md § Decisions D6) — same request shape as before this
    // ticket, unchanged (routes/api/order/index.post.ts).
    const orderResponse = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billingAddress: state.billingAddress,
        shippingAddress: state.shippingAddress,
      }),
    });

    if (!orderResponse.ok) {
      const refusal = (await orderResponse.json()) as OrderRefusal;
      setSubmitting(false);

      // An empty cart isn't a field problem this screen can show against a
      // card field — send the shopper back to /cart, mirroring what
      // enter-order-information.tsx used to do itself before this ticket
      // moved the /api/order call here (design.md § Spec discrepancies S5).
      if (refusal.emptyCart) {
        navigate("/cart", { state: { emptyCart: true } });
        return;
      }
      setFormError(ORDER_FAILED_ALERT);
      return;
    }

    const result = (await orderResponse.json()) as OrderOutcome;
    navigate("/order-completed", { state: { orderId: result.orderId, email: result.email } });
  }

  if (!state) return null;

  return (
    <>
      <StoreHeader />
      <div className={cn(CONTENT_WIDTH, "mx-auto p-6")}>
        <Link
          to="/enter-order-information"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Order information
        </Link>
        <h1 className="text-foreground mt-2 text-xl font-bold">Payment Details</h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Step 2 of 3 · Your card is authorized when you submit the order.
        </p>

        {formError && (
          <p
            role="alert"
            className="border-destructive bg-background text-destructive mt-3 rounded-md border px-3 py-2 text-sm"
          >
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <section
            aria-label="Order summary"
            className="border-border bg-card mt-3 rounded-[10px] border p-4"
          >
            <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
              <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                Order summary
              </h2>
              <Link to="/cart" className="text-muted-foreground text-xs hover:underline">
                Edit cart
              </Link>
            </div>

            {cart === null ? (
              <p role="status" className="text-muted-foreground text-sm">
                Loading order summary…
              </p>
            ) : (
              <>
                <ul>
                  {cart.items.map((item) => (
                    <li
                      key={item.itemId}
                      className="border-border flex items-start justify-between gap-3 border-b py-2.5 last:border-0"
                    >
                      <span>
                        <span className="block text-sm font-medium">{item.productName}</span>
                        <span className="text-muted-foreground mt-0.5 block text-[11px]">
                          {item.quantity} × {formatCurrency(item.unitCost)}
                        </span>
                      </span>
                      <span className="text-right text-sm tabular-nums">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-border mt-1 flex flex-col gap-2 border-t pt-3">
                  <div className="text-foreground flex justify-between text-[15px] font-bold">
                    <span>
                      Subtotal ({cart.count} {cart.count === 1 ? "item" : "items"})
                    </span>
                    <span>{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Tax and shipping are not calculated. This is the amount sent for authorization.
                  </p>
                </div>
              </>
            )}
          </section>

          <section
            aria-label="Billing address"
            className="border-border bg-card mt-3 rounded-[10px] border p-4"
          >
            <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
              <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                Billing address
              </h2>
              <Link
                to="/enter-order-information"
                className="text-muted-foreground text-xs hover:underline"
              >
                Change
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-foreground text-sm">
                  {state.billingAddress.givenName} {state.billingAddress.familyName}
                </div>
                <div className="text-muted-foreground mt-0.5 text-sm">
                  {formatAddress(state.billingAddress)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Email</div>
                <div className="text-foreground mt-0.5 text-sm">{state.billingAddress.email}</div>
              </div>
            </div>
          </section>

          <section
            aria-label="Payment method"
            className="border-border bg-card mt-3 rounded-[10px] border p-4"
          >
            <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
              <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                Payment method
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="cardholderName" className="text-foreground text-sm font-medium">
                  Cardholder name
                </label>
                <input
                  id="cardholderName"
                  maxLength={30}
                  className={inputClassName}
                  value={card.cardholderName}
                  disabled={submitting}
                  onChange={(event) => update("cardholderName", event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="cardType" className="text-foreground text-sm font-medium">
                  Card type
                </label>
                <select
                  id="cardType"
                  className={fieldClassName("cardType")}
                  value={card.cardType}
                  disabled={submitting}
                  aria-invalid={invalid("cardType") ? "true" : undefined}
                  onChange={(event) => update("cardType", event.target.value)}
                >
                  <option value="">— Select —</option>
                  {CARD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {renderFieldError("cardType")}
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="cardNumber" className="text-foreground text-sm font-medium">
                  Card number
                </label>
                <input
                  id="cardNumber"
                  className={fieldClassName("cardNumber")}
                  value={card.cardNumber}
                  disabled={submitting}
                  aria-invalid={invalid("cardNumber") ? "true" : undefined}
                  onChange={(event) => update("cardNumber", event.target.value)}
                />
                {renderFieldError("cardNumber")}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="expiryMonth" className="text-foreground text-sm font-medium">
                  Expiry month
                </label>
                <select
                  id="expiryMonth"
                  className={fieldClassName("expiryMonth")}
                  value={card.expiryMonth}
                  disabled={submitting}
                  aria-invalid={invalid("expiryMonth") ? "true" : undefined}
                  onChange={(event) => update("expiryMonth", event.target.value)}
                >
                  <option value="">— Select —</option>
                  {EXPIRY_MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                {renderFieldError("expiryMonth")}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="expiryYear" className="text-foreground text-sm font-medium">
                  Expiry year
                </label>
                <select
                  id="expiryYear"
                  className={fieldClassName("expiryYear")}
                  value={card.expiryYear}
                  disabled={submitting}
                  aria-invalid={invalid("expiryYear") ? "true" : undefined}
                  onChange={(event) => update("expiryYear", event.target.value)}
                >
                  <option value="">— Select —</option>
                  {EXPIRY_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-muted-foreground mt-2.5 text-[11px] leading-relaxed">
              {formatAcceptedTypes(CARD_TYPES)} are accepted.
            </p>
          </section>

          <div className="mt-4 flex items-center gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Authorizing…" : "Submit payment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => navigate("/enter-order-information")}
            >
              Back to order information
            </Button>
            {submitting && (
              <span role="status" className="text-muted-foreground text-sm">
                Authorizing payment…
              </span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <RequireSignOn>
      <Payment />
    </RequireSignOn>
  );
}
