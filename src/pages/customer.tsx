import type { FormEvent, ReactNode } from "react";

import { Button, RequireSignOn } from "@/components";

import { CARD_TYPES, CATEGORIES, COUNTRIES, LANGUAGES, STATES } from "../../account/vocabulary";
import type { AccountUpdate, CustomerAccount } from "../../account/types";

const inputClassName =
  "border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm";

type EditFormState = {
  givenName: string;
  familyName: string;
  telephone: string;
  email: string;
  streetName1: string;
  streetName2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  cardType: string;
  expiryDate: string;
  cardNumber: string;
  preferredLanguage: string;
  favoriteCategory: string;
  myListPreference: boolean;
  bannerPreference: boolean;
};

function toFormState(account: CustomerAccount): EditFormState {
  return {
    givenName: account.contactInfo.givenName ?? "",
    familyName: account.contactInfo.familyName ?? "",
    telephone: account.contactInfo.telephone ?? "",
    email: account.contactInfo.email ?? "",
    streetName1: account.address.streetName1 ?? "",
    streetName2: account.address.streetName2 ?? "",
    city: account.address.city ?? "",
    state: account.address.state ?? "",
    zipCode: account.address.zipCode ?? "",
    country: account.address.country ?? "",
    cardType: account.card.cardType ?? "",
    expiryDate: account.card.expiryDate ?? "",
    cardNumber: account.card.lastFour ?? "",
    preferredLanguage: account.profile.preferredLanguage,
    favoriteCategory: account.profile.favoriteCategory ?? "",
    myListPreference: account.profile.myListPreference,
    bannerPreference: account.profile.bannerPreference,
  };
}

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

function buildUpdate(form: EditFormState): AccountUpdate {
  return {
    contactInfo: {
      givenName: emptyToNull(form.givenName),
      familyName: emptyToNull(form.familyName),
      telephone: emptyToNull(form.telephone),
      email: emptyToNull(form.email),
    },
    address: {
      streetName1: emptyToNull(form.streetName1),
      streetName2: emptyToNull(form.streetName2),
      city: emptyToNull(form.city),
      state: emptyToNull(form.state),
      zipCode: emptyToNull(form.zipCode),
      country: emptyToNull(form.country),
    },
    card: {
      cardType: emptyToNull(form.cardType),
      expiryDate: emptyToNull(form.expiryDate),
      cardNumber: form.cardNumber.trim() === "" ? undefined : form.cardNumber,
    },
    profile: {
      preferredLanguage: form.preferredLanguage,
      favoriteCategory: emptyToNull(form.favoriteCategory),
      myListPreference: form.myListPreference,
      bannerPreference: form.bannerPreference,
    },
  };
}

function display(value: string | null): string {
  return value && value.trim() !== "" ? value : "—";
}

function ReadOnlyField({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}
    >
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground text-sm">{value}</span>
    </div>
  );
}

function ProfileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="border-border bg-card mb-4 rounded-lg border p-4">
      <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
        <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">{title}</h2>
        <span className="border-border bg-secondary text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase">
          Read only
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function streetAddress(account: CustomerAccount): string {
  return [account.address.streetName1, account.address.streetName2].filter(Boolean).join(", ");
}

export function CustomerProfile() {
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/customer")
      .then((response) => response.json() as Promise<CustomerAccount>)
      .then((data) => {
        if (cancelled) return;
        setAccount(data);
        document.documentElement.lang = data.profile.preferredLanguage;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function startEdit() {
    if (!account) return;
    setForm(toFormState(account));
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  function updateForm<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    const response = await fetch("/api/customer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildUpdate(form)),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error: string };
      setError(body.error);
      return;
    }

    const updated = (await response.json()) as CustomerAccount;
    setAccount(updated);
    // Purge the just-typed full card number from client state immediately —
    // don't wait for the next edit open to overwrite it (design.md D1).
    setForm(toFormState(updated));
    document.documentElement.lang = updated.profile.preferredLanguage;
    setError(null);
    setEditing(false);
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-[672px] p-6">
        <h1 className="text-foreground text-xl font-bold">Customer Profile</h1>
        <p role="status" className="text-muted-foreground mt-4 text-sm">
          Loading account…
        </p>
      </div>
    );
  }

  if (editing && form) {
    return (
      <div className="mx-auto max-w-[672px] p-6">
        <h1 className="text-foreground text-xl font-bold">Customer Profile</h1>

        {error && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {error}
          </p>
        )}

        <form
          aria-label="Edit profile"
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="givenName" className="text-foreground text-sm font-medium">
                First name
              </label>
              <input
                id="givenName"
                className={inputClassName}
                value={form.givenName}
                onChange={(event) => updateForm("givenName", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="familyName" className="text-foreground text-sm font-medium">
                Last name
              </label>
              <input
                id="familyName"
                className={inputClassName}
                value={form.familyName}
                onChange={(event) => updateForm("familyName", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="telephone" className="text-foreground text-sm font-medium">
                Telephone
              </label>
              <input
                id="telephone"
                className={inputClassName}
                value={form.telephone}
                onChange={(event) => updateForm("telephone", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-foreground text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={inputClassName}
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="streetName1" className="text-foreground text-sm font-medium">
                Street address line 1
              </label>
              <input
                id="streetName1"
                className={inputClassName}
                value={form.streetName1}
                onChange={(event) => updateForm("streetName1", event.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="streetName2" className="text-foreground text-sm font-medium">
                Street address line 2
              </label>
              <input
                id="streetName2"
                className={inputClassName}
                value={form.streetName2}
                onChange={(event) => updateForm("streetName2", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="city" className="text-foreground text-sm font-medium">
                City
              </label>
              <input
                id="city"
                className={inputClassName}
                value={form.city}
                onChange={(event) => updateForm("city", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="state" className="text-foreground text-sm font-medium">
                State / Province
              </label>
              <select
                id="state"
                className={inputClassName}
                value={form.state}
                onChange={(event) => updateForm("state", event.target.value)}
              >
                <option value="">— None —</option>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="zipCode" className="text-foreground text-sm font-medium">
                Postal code
              </label>
              <input
                id="zipCode"
                className={inputClassName}
                value={form.zipCode}
                onChange={(event) => updateForm("zipCode", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="country" className="text-foreground text-sm font-medium">
                Country
              </label>
              <select
                id="country"
                className={inputClassName}
                value={form.country}
                onChange={(event) => updateForm("country", event.target.value)}
              >
                <option value="">— None —</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cardType" className="text-foreground text-sm font-medium">
                Card type
              </label>
              <select
                id="cardType"
                className={inputClassName}
                value={form.cardType}
                onChange={(event) => updateForm("cardType", event.target.value)}
              >
                <option value="">— None —</option>
                {CARD_TYPES.map((cardType) => (
                  <option key={cardType} value={cardType}>
                    {cardType}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="expiryDate" className="text-foreground text-sm font-medium">
                Expiry (MM/YYYY)
              </label>
              <input
                id="expiryDate"
                placeholder="MM/YYYY"
                className={inputClassName}
                value={form.expiryDate}
                onChange={(event) => updateForm("expiryDate", event.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="cardNumber" className="text-foreground text-sm font-medium">
                Card number
              </label>
              <input
                id="cardNumber"
                className={inputClassName}
                value={form.cardNumber}
                onChange={(event) => updateForm("cardNumber", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="preferredLanguage" className="text-foreground text-sm font-medium">
                Preferred language
              </label>
              <select
                id="preferredLanguage"
                className={inputClassName}
                value={form.preferredLanguage}
                onChange={(event) => updateForm("preferredLanguage", event.target.value)}
              >
                {LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="favoriteCategory" className="text-foreground text-sm font-medium">
                Favorite category
              </label>
              <select
                id="favoriteCategory"
                className={inputClassName}
                value={form.favoriteCategory}
                onChange={(event) => updateForm("favoriteCategory", event.target.value)}
              >
                <option value="">— No preference —</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="myListPreference"
                type="checkbox"
                checked={form.myListPreference}
                onChange={(event) => updateForm("myListPreference", event.target.checked)}
              />
              <label htmlFor="myListPreference" className="text-foreground text-sm">
                Add to My List by default
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="bannerPreference"
                type="checkbox"
                checked={form.bannerPreference}
                onChange={(event) => updateForm("bannerPreference", event.target.checked)}
              />
              <label htmlFor="bannerPreference" className="text-foreground text-sm">
                Show banner promotions
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">Save changes</Button>
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <h1 className="text-foreground text-xl font-bold">Customer Profile</h1>

      <ProfileCard title="Contact information">
        <ReadOnlyField label="First name" value={display(account.contactInfo.givenName)} />
        <ReadOnlyField label="Last name" value={display(account.contactInfo.familyName)} />
        <ReadOnlyField
          label="Street address"
          value={display(streetAddress(account) || null)}
          full
        />
        <ReadOnlyField label="City" value={display(account.address.city)} />
        <ReadOnlyField label="State / Province" value={display(account.address.state)} />
        <ReadOnlyField label="Postal code" value={display(account.address.zipCode)} />
        <ReadOnlyField label="Country" value={display(account.address.country)} />
      </ProfileCard>

      <ProfileCard title="Account details">
        <ReadOnlyField label="Account status" value={display(account.status)} />
        <ReadOnlyField label="Telephone" value={display(account.contactInfo.telephone)} />
        <ReadOnlyField label="Email" value={display(account.contactInfo.email)} />
        <ReadOnlyField label="Card type" value={display(account.card.cardType)} />
      </ProfileCard>

      <Button onClick={startEdit}>Edit profile</Button>
    </div>
  );
}

export default function Customer() {
  return (
    <RequireSignOn>
      <CustomerProfile />
    </RequireSignOn>
  );
}
