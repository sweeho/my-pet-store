import type { FormEvent } from "react";
import { Link } from "react-router";

import { Button, RequireSignOn } from "@/components";

import { COUNTRIES, STATES } from "../../account/vocabulary";
import type { Cart } from "../../cart/types";
import { OrderValidationError, validateOrderSubmission } from "../../order/validation";

const inputClassName =
  "border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm";

// The generic message DESIGN.md § Form validation states requires above the
// form: it reports that the submission was refused without enumerating
// fields, matching the mockup's alert copy verbatim.
const SUBMISSION_REFUSED_MESSAGE =
  "Please correct the highlighted field before submitting your order.";

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

// The server validates one field at a time (order/validation.ts throws on
// the first problem it finds), so a refusal ever names at most one field —
// this carries which one, and the message DESIGN.md's field-level alert
// shows next to it.
type SectionError = { field: keyof SectionForm; message: string };

function AddressSection({
  title,
  badge,
  idPrefix,
  values,
  onChange,
  error,
}: {
  title: string;
  badge: string;
  idPrefix: string;
  values: SectionForm;
  onChange: (field: keyof SectionForm, value: string) => void;
  error: SectionError | null;
}) {
  function invalid(field: keyof SectionForm): boolean {
    return error?.field === field;
  }

  function fieldMessage(field: keyof SectionForm): string | null {
    return error?.field === field ? error.message : null;
  }

  function fieldClassName(field: keyof SectionForm): string {
    return invalid(field) ? `${inputClassName} border-destructive` : inputClassName;
  }

  function fieldError(field: keyof SectionForm) {
    const message = fieldMessage(field);
    if (!message) return null;
    return (
      <p role="alert" className="text-destructive text-xs">
        {message}
      </p>
    );
  }

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
            className={fieldClassName("givenName")}
            value={values.givenName}
            aria-invalid={invalid("givenName") ? "true" : undefined}
            onChange={(event) => onChange("givenName", event.target.value)}
          />
          {fieldError("givenName")}
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
            className={fieldClassName("familyName")}
            value={values.familyName}
            aria-invalid={invalid("familyName") ? "true" : undefined}
            onChange={(event) => onChange("familyName", event.target.value)}
          />
          {fieldError("familyName")}
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-street1`} className="text-foreground text-sm font-medium">
            Street address line 1
          </label>
          <input
            id={`${idPrefix}-street1`}
            maxLength={70}
            className={fieldClassName("streetName1")}
            value={values.streetName1}
            aria-invalid={invalid("streetName1") ? "true" : undefined}
            onChange={(event) => onChange("streetName1", event.target.value)}
          />
          {fieldError("streetName1")}
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-street2`} className="text-foreground text-sm font-medium">
            Street address line 2
          </label>
          <input
            id={`${idPrefix}-street2`}
            maxLength={70}
            className={fieldClassName("streetName2")}
            value={values.streetName2}
            aria-invalid={invalid("streetName2") ? "true" : undefined}
            onChange={(event) => onChange("streetName2", event.target.value)}
          />
          {fieldError("streetName2")}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-city`} className="text-foreground text-sm font-medium">
            City
          </label>
          <input
            id={`${idPrefix}-city`}
            maxLength={30}
            className={fieldClassName("city")}
            value={values.city}
            aria-invalid={invalid("city") ? "true" : undefined}
            onChange={(event) => onChange("city", event.target.value)}
          />
          {fieldError("city")}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-state`} className="text-foreground text-sm font-medium">
            State / Province
          </label>
          <select
            id={`${idPrefix}-state`}
            className={fieldClassName("state")}
            value={values.state}
            aria-invalid={invalid("state") ? "true" : undefined}
            onChange={(event) => onChange("state", event.target.value)}
          >
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {fieldError("state")}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-zip`} className="text-foreground text-sm font-medium">
            Postal code
          </label>
          <input
            id={`${idPrefix}-zip`}
            maxLength={20}
            className={fieldClassName("zipCode")}
            value={values.zipCode}
            aria-invalid={invalid("zipCode") ? "true" : undefined}
            onChange={(event) => onChange("zipCode", event.target.value)}
          />
          {fieldError("zipCode")}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-country`} className="text-foreground text-sm font-medium">
            Country
          </label>
          <select
            id={`${idPrefix}-country`}
            className={fieldClassName("country")}
            value={values.country}
            aria-invalid={invalid("country") ? "true" : undefined}
            onChange={(event) => onChange("country", event.target.value)}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {fieldError("country")}
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-phone`} className="text-foreground text-sm font-medium">
            Telephone
          </label>
          <input
            id={`${idPrefix}-phone`}
            maxLength={20}
            className={fieldClassName("telephone")}
            value={values.telephone}
            aria-invalid={invalid("telephone") ? "true" : undefined}
            onChange={(event) => onChange("telephone", event.target.value)}
          />
          {fieldError("telephone")}
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-email`} className="text-foreground text-sm font-medium">
            Email
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            maxLength={50}
            className={fieldClassName("email")}
            value={values.email}
            aria-invalid={invalid("email") ? "true" : undefined}
            onChange={(event) => onChange("email", event.target.value)}
          />
          {fieldError("email")}
        </div>
      </div>
    </section>
  );
}

function toOrderAddress(section: SectionForm) {
  return {
    givenName: section.givenName,
    familyName: section.familyName,
    streetName1: section.streetName1,
    streetName2: section.streetName2 === "" ? null : section.streetName2,
    city: section.city,
    state: section.state,
    zipCode: section.zipCode,
    country: section.country,
    telephone: section.telephone,
    email: section.email,
  };
}

export function EnterOrderInformation() {
  const navigate = useNavigate();

  const [billing, setBilling] = useState<SectionForm>(emptySection);
  const [shipping, setShipping] = useState<SectionForm>(emptySection);
  const [cart, setCart] = useState<Cart | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<SectionError | null>(null);
  const [shippingError, setShippingError] = useState<SectionError | null>(null);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submission = {
      billingAddress: toOrderAddress(billing),
      shippingAddress: toOrderAddress(shipping),
    };

    // Validated here, with the same function the server runs
    // (order/validation.ts, imported not reimplemented), rather than
    // deferred to /api/order: that call now happens only after payment
    // authorization succeeds (design.md § Decisions D6), so it must never
    // run merely to discover a bad address field.
    try {
      validateOrderSubmission(submission);
    } catch (error) {
      if (!(error instanceof OrderValidationError)) throw error;
      setFormError(SUBMISSION_REFUSED_MESSAGE);
      setBillingError(
        error.section === "billing" ? { field: error.field, message: error.message } : null,
      );
      setShippingError(
        error.section === "shipping" ? { field: error.field, message: error.message } : null,
      );
      return;
    }

    setFormError(null);
    setBillingError(null);
    setShippingError(null);
    navigate("/payment", { state: submission });
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

      {formError && (
        <p
          role="alert"
          className="border-destructive bg-background text-destructive mt-3 rounded-md border px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_340px]"
      >
        <AddressSection
          title="Billing Information"
          badge="Address A"
          idPrefix="billing"
          values={billing}
          onChange={updateBilling}
          error={billingError}
        />
        <AddressSection
          title="Shipping Information"
          badge="Address B"
          idPrefix="shipping"
          values={shipping}
          onChange={updateShipping}
          error={shippingError}
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
            <Button type="submit" className="w-full">
              Submit Order
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/cart">Return to Cart</Link>
            </Button>
          </div>
        </aside>
      </form>
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
