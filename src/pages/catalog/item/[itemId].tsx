import { Link, useParams } from "react-router";

import type { Item } from "../../../../catalog/types";
import NotFound from "../../NotFound";
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
  const { locale } = useCatalogLocale();

  const itemUrl =
    locale && itemId
      ? `/api/catalog/items/${encodeURIComponent(itemId)}?locale=${encodeURIComponent(locale)}`
      : null;

  const { data: item, notFound } = useCatalogFetch<Item>(itemUrl);

  if (notFound) return <NotFound />;
  if (!item) return null;

  // The Item type carries no item-specific name (a faithful legacy trait —
  // items are distinguished from their siblings by description and
  // attributes, not a separate name field), so productName is the heading
  // and the item's own description is what identifies this specific item.
  const attributes: [string, string | null][] = [
    ["Attribute 1", item.attribute1],
    ["Attribute 2", item.attribute2],
    ["Attribute 3", item.attribute3],
    ["Attribute 4", item.attribute4],
    ["Attribute 5", item.attribute5],
  ];

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <Link
        to={`/catalog/product/${item.productId}`}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← {item.productName}
      </Link>
      <h1 className="text-foreground mt-2 text-xl font-bold">{item.productName}</h1>

      <img src={item.imageLocation} alt={item.productName} className="mt-4 max-w-xs rounded-md" />

      <p className="text-foreground mt-4 text-sm">{item.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {attributes.map(([label, value]) => (
          <AttributeField key={label} label={label} value={value} />
        ))}
      </div>

      <p className="text-foreground mt-4 text-lg font-bold">${item.listPrice.toFixed(2)}</p>
    </div>
  );
}
