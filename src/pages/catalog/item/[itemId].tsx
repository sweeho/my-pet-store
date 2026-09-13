import { Link, useParams } from "react-router";

import { LanguageSwitcher } from "@/components";

import { DEFAULT_LOCALE } from "../../../../catalog/locale";
import type { Item } from "../../../../catalog/types";
import NotFound from "../../NotFound";
import { LANGUAGE_SWITCHER_MOUNT_ID, UnavailableInLanguage } from "../UnavailableInLanguage";
import { useCatalogLocale } from "../shared";

// Mirrors catalog/availability.ts's MissingReason — duplicated rather than
// imported because that module reaches db/client.ts at runtime, and
// everything under catalog/ is out of this ticket's ownership.
type MissingReason = "not-found" | "missing-translation";

type ItemFetchResult = { url: string; data: Item | null; reason: MissingReason | null };

// A local variant of shared.ts's useCatalogFetch: that hook collapses a 404
// to a bare boolean and discards the body, but this screen needs the
// "reason" field the body carries (missing-translation vs not-found,
// SWHM-T-0074) to tell the two apart. shared.ts belongs to SWHM-T-0072, so
// this is scoped to the one screen that needs it rather than changing the
// shared hook.
function useItemFetch(url: string | null): { data: Item | null; reason: MissingReason | null } {
  const [result, setResult] = useState<ItemFetchResult | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetch(url).then((response) => {
      if (cancelled) return;
      (response.json() as Promise<Item | { error: string; reason: MissingReason }>).then((body) => {
        if (cancelled) return;
        if (response.status === 404) {
          setResult({ url, data: null, reason: (body as { reason: MissingReason }).reason });
          return;
        }
        setResult({ url, data: body as Item, reason: null });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!result || result.url !== url) {
    return { data: null, reason: null };
  }
  return { data: result.data, reason: result.reason };
}

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

  useEffect(() => {
    if (locale) document.documentElement.lang = locale;
  }, [locale]);

  const itemUrl =
    locale && itemId
      ? `/api/catalog/items/${encodeURIComponent(itemId)}?locale=${encodeURIComponent(locale)}`
      : null;

  const { data: item, reason } = useItemFetch(itemUrl);

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
          <div id={LANGUAGE_SWITCHER_MOUNT_ID}>
            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        )}
      </div>

      {reason === "missing-translation" ? (
        <UnavailableInLanguage
          locale={locale ?? DEFAULT_LOCALE}
          onViewInEnglish={() => setLocale(DEFAULT_LOCALE)}
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
          />

          <p className="text-foreground mt-4 text-sm">{item.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {attributes.map(([label, value]) => (
              <AttributeField key={label} label={label} value={value} />
            ))}
          </div>

          <p className="text-foreground mt-4 text-lg font-bold">${item.listPrice.toFixed(2)}</p>
        </>
      )}
    </div>
  );
}
