import { Link, useParams, useSearchParams } from "react-router";

import { Button } from "@/components";

import type { Category, Page, Product } from "../../../../catalog/types";
import NotFound from "../../NotFound";
import { paginationLinks, useCatalogFetch, useCatalogLocale } from "../shared";

const PAGE_SIZE = 10;

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { locale } = useCatalogLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const start = Number(searchParams.get("start") ?? "0");

  const categoryUrl =
    locale && categoryId
      ? `/api/catalog/categories/${encodeURIComponent(categoryId)}?locale=${encodeURIComponent(locale)}`
      : null;
  const productsUrl =
    locale && categoryId
      ? `/api/catalog/products?categoryId=${encodeURIComponent(categoryId)}&start=${start}&count=${PAGE_SIZE}&locale=${encodeURIComponent(locale)}`
      : null;

  const { data: category, notFound } = useCatalogFetch<Category>(categoryUrl);
  const { data: products } = useCatalogFetch<Page<Product>>(productsUrl);

  function goToStart(newStart: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("start", String(newStart));
      return next;
    });
  }

  if (notFound) return <NotFound />;
  if (!category) return null;

  const { prevStart, nextStart } = products
    ? paginationLinks(products, PAGE_SIZE)
    : { prevStart: null, nextStart: null };

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <Link to="/catalog" className="text-muted-foreground text-sm hover:underline">
        ← Catalog
      </Link>
      <h1 className="text-foreground mt-2 text-xl font-bold">{category.name}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{category.description}</p>

      {products && (
        <ul className="mt-6 flex flex-col gap-2">
          {products.objects.map((product) => (
            <li key={product.id}>
              <Link
                to={`/catalog/product/${product.id}`}
                className="text-foreground hover:underline"
              >
                {product.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {products && (
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
