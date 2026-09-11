import { Link, useParams, useSearchParams } from "react-router";

import { Button } from "@/components";

import type { Item, Page, Product } from "../../../../catalog/types";
import NotFound from "../../NotFound";
import { paginationLinks, useCatalogFetch, useCatalogLocale } from "../shared";

const PAGE_SIZE = 10;

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const locale = useCatalogLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const start = Number(searchParams.get("start") ?? "0");

  const productUrl =
    locale && productId
      ? `/api/catalog/products/${encodeURIComponent(productId)}?locale=${encodeURIComponent(locale)}`
      : null;
  const itemsUrl =
    locale && productId
      ? `/api/catalog/items?productId=${encodeURIComponent(productId)}&start=${start}&count=${PAGE_SIZE}&locale=${encodeURIComponent(locale)}`
      : null;

  const { data: product, notFound } = useCatalogFetch<Product>(productUrl);
  const { data: items } = useCatalogFetch<Page<Item>>(itemsUrl);

  function goToStart(newStart: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("start", String(newStart));
      return next;
    });
  }

  if (notFound) return <NotFound />;
  if (!product) return null;

  const { prevStart, nextStart } = items
    ? paginationLinks(items, PAGE_SIZE)
    : { prevStart: null, nextStart: null };

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <Link
        to={`/catalog/category/${product.categoryId}`}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← {product.categoryId}
      </Link>
      <h1 className="text-foreground mt-2 text-xl font-bold">{product.name}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{product.description}</p>

      {items && (
        <ul className="mt-6 flex flex-col gap-2">
          {items.objects.map((item) => (
            <li key={item.itemId}>
              <Link to={`/catalog/item/${item.itemId}`} className="text-foreground hover:underline">
                {item.description}
              </Link>
              <span className="text-muted-foreground ml-2 text-xs">
                ${item.listPrice.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {items && (
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            disabled={prevStart === null}
            onClick={() => goToStart(prevStart ?? 0)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={nextStart === null}
            onClick={() => goToStart(nextStart ?? 0)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
