import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components";

import type { Category, Item, Page } from "../../../catalog/types";
import { paginationLinks, useCatalogFetch, useCatalogLocale } from "./shared";

const PAGE_SIZE = 10;

export default function CatalogHome() {
  const locale = useCatalogLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const start = Number(searchParams.get("start") ?? "0");
  const q = searchParams.get("q") ?? "";

  const categoriesUrl =
    locale && !q
      ? `/api/catalog/categories?start=${start}&count=${PAGE_SIZE}&locale=${encodeURIComponent(locale)}`
      : null;
  const searchUrl =
    locale && q
      ? `/api/catalog/search?q=${encodeURIComponent(q)}&start=${start}&count=${PAGE_SIZE}&locale=${encodeURIComponent(locale)}`
      : null;

  const { data: categories } = useCatalogFetch<Page<Category>>(categoriesUrl);
  const { data: searchResults } = useCatalogFetch<Page<Item>>(searchUrl);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    setSearchParams(query ? { q: query } : {});
  }

  function goToStart(newStart: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("start", String(newStart));
      return next;
    });
  }

  const activePage = q ? searchResults : categories;
  const { prevStart, nextStart } = activePage
    ? paginationLinks(activePage, PAGE_SIZE)
    : { prevStart: null, nextStart: null };

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <h1 className="text-foreground text-xl font-bold">Catalog</h1>

      <form
        role="search"
        aria-label="Search the catalog"
        onSubmit={submitSearch}
        className="mt-4 flex gap-2"
      >
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search items"
          aria-label="Search query"
          className="border-input bg-background text-foreground flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <Button type="submit">Search</Button>
      </form>

      {q && searchResults && (
        <section aria-label={`Search results for "${q}"`} className="mt-6">
          <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            Search results for &quot;{q}&quot;
          </h2>
          {searchResults.objects.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">No items matched your search.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {searchResults.objects.map((item) => (
                <li key={item.itemId}>
                  <Link
                    to={`/catalog/item/${item.itemId}`}
                    className="text-foreground hover:underline"
                  >
                    {item.description}
                  </Link>
                  <span className="text-muted-foreground ml-2 text-xs">{item.productName}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!q && categories && (
        <section aria-label="Categories" className="mt-6">
          <ul className="flex flex-col gap-2">
            {categories.objects.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/catalog/category/${category.id}`}
                  className="text-foreground hover:underline"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activePage && (
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
