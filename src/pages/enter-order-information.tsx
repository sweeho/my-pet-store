import { Link } from "react-router";

import { Button, RequireSignOn } from "@/components";

import { COUNTRIES, STATES } from "../../account/vocabulary";
import type { Cart } from "../../cart/types";

const inputClassName =
  "border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm";

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}

// One shape for each of the Billing/Shipping sections: the mockup and the
// delta spec ask for the same ten fields — every ContactInfo field alongside
// every Address field — in both (design.md § Spec discrepancies S6).
type SectionForm = {
  givenName: string;
  familyName: string;
  streetName1: string;
  streetName2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  telephone: string;
  email: string;
};

function emptySection(): SectionForm {
  return {
    givenName: "",
    familyName: "",
    streetName1: "",
    streetName2: "",
    city: "",
    state: STATES[0],
    zipCode: "",
    country: COUNTRIES[0],
    telephone: "",
    email: "",
  };
}

function AddressSection({
  title,
  badge,
  idPrefix,
  values,
  onChange,
}: {
  title: string;
  badge: string;
  idPrefix: string;
  values: SectionForm;
  onChange: (field: keyof SectionForm, value: string) => void;
}) {
  return (
    <section
      aria-label={title}
      className="border-border bg-card flex flex-col rounded-[10px] border p-4"
    >
      <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
        <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">{title}</h2>
        <span className="border-border bg-secondary text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase">
          {badge}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-given-name`} className="text-foreground text-sm font-medium">
            First name
          </label>
          <input
            id={`${idPrefix}-given-name`}
            maxLength={30}
            className={inputClassName}
            value={values.givenName}
            onChange={(event) => onChange("givenName", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${idPrefix}-family-name`}
            className="text-foreground text-sm font-medium"
          >
            Last name
          </label>
          <input
            id={`${idPrefix}-family-name`}
            maxLength={30}
            className={inputClassName}
            value={values.familyName}
            onChange={(event) => onChange("familyName", event.target.value)}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-street1`} className="text-foreground text-sm font-medium">
            Street address line 1
          </label>
          <input
            id={`${idPrefix}-street1`}
            maxLength={70}
            className={inputClassName}
            value={values.streetName1}
            onChange={(event) => onChange("streetName1", event.target.value)}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-street2`} className="text-foreground text-sm font-medium">
            Street address line 2
          </label>
          <input
            id={`${idPrefix}-street2`}
            maxLength={70}
            className={inputClassName}
            value={values.streetName2}
            onChange={(event) => onChange("streetName2", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-city`} className="text-foreground text-sm font-medium">
            City
          </label>
          <input
            id={`${idPrefix}-city`}
            maxLength={30}
            className={inputClassName}
            value={values.city}
            onChange={(event) => onChange("city", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-state`} className="text-foreground text-sm font-medium">
            State / Province
          </label>
          <select
            id={`${idPrefix}-state`}
            className={inputClassName}
            value={values.state}
            onChange={(event) => onChange("state", event.target.value)}
          >
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-zip`} className="text-foreground text-sm font-medium">
            Postal code
          </label>
          <input
            id={`${idPrefix}-zip`}
            maxLength={20}
            className={inputClassName}
            value={values.zipCode}
            onChange={(event) => onChange("zipCode", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-country`} className="text-foreground text-sm font-medium">
            Country
          </label>
          <select
            id={`${idPrefix}-country`}
            className={inputClassName}
            value={values.country}
            onChange={(event) => onChange("country", event.target.value)}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-phone`} className="text-foreground text-sm font-medium">
            Telephone
          </label>
          <input
            id={`${idPrefix}-phone`}
            maxLength={20}
            className={inputClassName}
            value={values.telephone}
            onChange={(event) => onChange("telephone", event.target.value)}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-email`} className="text-foreground text-sm font-medium">
            Email
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            maxLength={50}
            className={inputClassName}
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

export function EnterOrderInformation() {
  const [billing, setBilling] = useState<SectionForm>(emptySection);
  const [shipping, setShipping] = useState<SectionForm>(emptySection);
  const [cart, setCart] = useState<Cart | null>(null);

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

  function updateBilling(field: keyof SectionForm, value: string) {
    setBilling((current) => ({ ...current, [field]: value }));
  }

  function updateShipping(field: keyof SectionForm, value: string) {
    setShipping((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="mx-auto max-w-[1160px] p-6">
      <Link to="/cart" className="text-muted-foreground text-sm hover:underline">
        ← Shopping Cart
      </Link>
      <h1 className="text-foreground mt-2 text-xl font-bold">Enter Order Information</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Tell us where to bill this order and where to send it. Order date is recorded when you
        submit.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_340px]">
        <AddressSection
          title="Billing Information"
          badge="Address A"
          idPrefix="billing"
          values={billing}
          onChange={updateBilling}
        />
        <AddressSection
          title="Shipping Information"
          badge="Address B"
          idPrefix="shipping"
          values={shipping}
          onChange={updateShipping}
        />

        <aside
          aria-label="Your Order"
          className="border-border bg-card flex flex-col rounded-[10px] border p-4"
        >
          <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
            <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
              Your Order
            </h2>
            {cart && (
              <span className="border-border bg-secondary text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase">
                {cart.count} {cart.count === 1 ? "item" : "items"}
              </span>
            )}
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
                    className="border-border flex items-start gap-3 border-b py-2.5 last:border-0"
                  >
                    <span className="bg-secondary border-border flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md border text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{item.productName}</span>
                      <span className="text-muted-foreground mt-0.5 block text-[11px]">
                        {item.itemId} · {formatCurrency(item.unitCost)} each
                      </span>
                    </span>
                    <span className="text-right text-sm tabular-nums">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-border mt-1 flex flex-col gap-2 border-t pt-3">
                <div className="text-muted-foreground flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="text-foreground flex justify-between text-[15px] font-bold">
                  <span>Order total</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
              </div>
              <p className="text-muted-foreground mt-2.5 text-[11px] leading-relaxed">
                Tax and shipping are not calculated at this stage. Your cart is emptied once the
                order is submitted.
              </p>
            </>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <Button type="button" className="w-full">
              Submit Order
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/cart">Return to Cart</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function EnterOrderInformationPage() {
  return (
    <RequireSignOn>
      <EnterOrderInformation />
    </RequireSignOn>
  );
}
