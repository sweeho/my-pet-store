import { Check, Mail } from "lucide-react";
import { Link, useLocation } from "react-router";

import { Button, RequireSignOn, StoreHeader } from "@/components";
import { CONTENT_WIDTH } from "@/components/layout";
import { cn } from "@/utils";

// The { orderId, email } shape SWHM-T-0156's placement route returns
// (PLAN.md step 4) — this screen renders from it and issues no fetch to
// read an order back.
type OrderCompletedState = { orderId: number; email: string };

function isOrderCompletedState(value: unknown): value is OrderCompletedState {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as OrderCompletedState).orderId === "number"
  );
}

export function OrderCompleted() {
  const location = useLocation();
  const state = isOrderCompletedState(location.state) ? location.state : null;

  return (
    <>
      <StoreHeader />
      <div className={cn(CONTENT_WIDTH, "mx-auto p-6")}>
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3.5 text-xs">
          <Link to="/cart" className="text-muted-foreground hover:underline">
            Shopping Cart
          </Link>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          <Link to="/enter-order-information" className="text-muted-foreground hover:underline">
            Order Information
          </Link>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          <span className="text-foreground">Confirmation</span>
        </nav>

        <section className="border-border bg-card rounded-[10px] border p-8">
          <div
            aria-hidden="true"
            className="bg-secondary border-border mb-[18px] flex h-11 w-11 items-center justify-center rounded-full border"
          >
            <Check className="h-[22px] w-[22px]" strokeWidth={2.2} />
          </div>

          <h1 className="text-foreground text-xl font-bold tracking-tight">
            Thank you, your order has been submitted.
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            We have recorded your order and emptied your shopping cart.
          </p>

          {state && (
            <>
              <div
                role="group"
                aria-label={`Your order Id is ${state.orderId}`}
                className="border-border bg-secondary mt-[22px] rounded-[10px] border px-[18px] py-4"
              >
                <div
                  aria-hidden="true"
                  className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase"
                >
                  Your order Id is
                </div>
                <div
                  aria-hidden="true"
                  className="mt-1 text-[28px] font-bold tracking-tight tabular-nums"
                >
                  {state.orderId}
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2.5">
                <Mail
                  aria-hidden="true"
                  className="text-muted-foreground mt-0.5 h-[17px] w-[17px] flex-none"
                />
                <p className="text-foreground text-sm leading-relaxed">
                  You should receive a confirmation e-mail soon at{" "}
                  <strong className="font-semibold">{state.email}</strong>.
                </p>
              </div>
            </>
          )}

          <div className="mt-[26px] flex gap-2">
            <Button asChild>
              <Link to="/catalog">Continue Shopping</Link>
            </Button>
          </div>
        </section>

        <p className="text-muted-foreground mt-[18px] text-xs">
          Keep your order Id — it identifies this order in any correspondence with us.
        </p>
      </div>
    </>
  );
}

export default function OrderCompletedPage() {
  return (
    <RequireSignOn>
      <OrderCompleted />
    </RequireSignOn>
  );
}
