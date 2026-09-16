import { Link, useParams } from "react-router";

import { Button, LanguageSwitcher } from "@/components";

import { DEFAULT_LOCALE } from "../../../../catalog/locale";
import type { Item } from "../../../../catalog/types";
import NotFound from "../../NotFound";
import { UnavailableInLanguage } from "../UnavailableInLanguage";
import { useCatalogFetch, useCatalogLocale } from "../shared";

function AttributeField({ label, value }: { label: string; value: string | null }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground text-sm">{value ?? "—"}</span>
    </div>
  );
}

export default function ItemPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { locale, setLocale } = useCatalogLocale();

  const [quantity, setQuantity] = useState(1);
  const [addStatus, setAddStatus] = useState<"idle" | "added" | "error">("idle");

  useEffect(() => {
    if (locale) document.documentElement.lang = locale;
  }, [locale]);

  async function handleAddToCart(item: Item) {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.itemId, quantity }),
    });
    setAddStatus(response.ok ? "added" : "error");
  }

  const itemUrl =
    locale && itemId
      ? `/api/catalog/items/${encodeURIComponent(itemId)}?locale=${encodeURIComponent(locale)}`
      : null;

  const { data: item, reason } = useCatalogFetch<Item>(itemUrl);

  if (reason === "not-found") return <NotFound />;

  // The Item type carries no item-specific name (a faithful legacy trait —
  // items are distinguished from their siblings by description and
  // attributes, not a separate name field), so productName is the heading
  // and the item's own description is what identifies this specific item.
  const attributes: [string, string | null][] = item
    ? [
        ["Attribute 1", item.attribute1],
        ["Attribute 2", item.attribute2],
        ["Attribute 3", item.attribute3],
        ["Attribute 4", item.attribute4],
        ["Attribute 5", item.attribute5],
      ]
    : [];

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <div className="flex items-start justify-between gap-4">
        <Link
          to={item ? `/catalog/product/${item.productId}` : "/catalog"}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← {item ? item.productName : "Catalog"}
        </Link>
        {locale && (
          <div>
            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        )}
      </div>

      {reason === "missing-translation" ? (
        <UnavailableInLanguage
          locale={locale ?? DEFAULT_LOCALE}
          entity="item"
          onViewInEnglish={() => setLocale(DEFAULT_LOCALE)}
          onChangeLocale={setLocale}
        />
      ) : !item ? (
        <>
          <h1 className="text-foreground mt-2 text-xl font-bold">Item</h1>
          <p role="status" className="text-muted-foreground mt-4 text-sm">
            Loading item…
          </p>
        </>
      ) : (
        <>
          <h1 className="text-foreground mt-2 text-xl font-bold">{item.productName}</h1>

          <img
            src={item.imageLocation}
            alt={item.productName}
            className="mt-4 max-w-xs rounded-md"
            onError={(event) => {
              const img = event.currentTarget;
              if (img.src.endsWith("/images/placeholder.svg")) return;
              img.src = "/images/placeholder.svg";
            }}
          />

          <p className="text-foreground mt-4 text-sm">{item.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {attributes.map(([label, value]) => (
              <AttributeField key={label} label={label} value={value} />
            ))}
          </div>

          <p className="text-foreground mt-4 text-lg font-bold">${item.listPrice.toFixed(2)}</p>

          <div className="mt-4 flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="quantity" className="text-foreground text-sm font-medium">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="border-input bg-background text-foreground w-20 rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={() => handleAddToCart(item)}>Add to Cart</Button>
          </div>

          {addStatus === "added" && (
            <p
              role="status"
              aria-label="Add to cart status"
              className="text-foreground mt-2 text-sm"
            >
              Added to cart.
            </p>
          )}
          {addStatus === "error" && (
            <p
              role="status"
              aria-label="Add to cart status"
              className="text-destructive mt-2 text-sm"
            >
              Could not add item to cart.
            </p>
          )}
        </>
      )}
    </div>
  );
}
