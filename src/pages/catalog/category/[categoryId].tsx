import { Link, useParams, useSearchParams } from "react-router";

import { Button, LanguageSwitcher } from "@/components";

import { DEFAULT_LOCALE } from "../../../../catalog/locale";
import type { Category, Page, Product } from "../../../../catalog/types";
import NotFound from "../../NotFound";
import { UnavailableInLanguage } from "../UnavailableInLanguage";
import { paginationLinks, useCatalogFetch, useCatalogLocale } from "../shared";

const PAGE_SIZE = 10;

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { locale, setLocale } = useCatalogLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const start = Number(searchParams.get("start") ?? "0");

  useEffect(() => {
    if (locale) document.documentElement.lang = locale;
  }, [locale]);

  const categoryUrl =
    locale && categoryId
      ? `/api/catalog/categories/${encodeURIComponent(categoryId)}?locale=${encodeURIComponent(locale)}`
      : null;
  const productsUrl =
    locale && categoryId
      ? `/api/catalog/products?categoryId=${encodeURIComponent(categoryId)}&start=${start}&count=${PAGE_SIZE}&locale=${encodeURIComponent(locale)}`
      : null;

  const { data: category, reason } = useCatalogFetch<Category>(categoryUrl);
  const { data: products } = useCatalogFetch<Page<Product>>(productsUrl);

  function goToStart(newStart: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("start", String(newStart));
      return next;
    });
  }

  if (reason === "not-found") return <NotFound />;

  const showUnavailable = Boolean(
    products && products.objects.length === 0 && locale !== DEFAULT_LOCALE,
  );

  const { prevStart, nextStart } = products
    ? paginationLinks(products, PAGE_SIZE)
    : { prevStart: null, nextStart: null };

  return (
    <div className="mx-auto max-w-[672px] p-6">
      <Link to="/catalog" className="text-muted-foreground text-sm hover:underline">
        ← Catalog
      </Link>

      <div className="mt-2 flex items-start justify-between gap-4">
        {category ? (
          <div>
            <h1 className="text-foreground text-xl font-bold">{category.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{category.description}</p>
          </div>
        ) : (
          <h1 className="text-foreground text-xl font-bold">Category</h1>
        )}
        {locale && (
          <div>
            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        )}
      </div>

      {reason === "missing-translation" ? (
        <UnavailableInLanguage
          locale={locale ?? DEFAULT_LOCALE}
          entity="category"
          onViewInEnglish={() => setLocale(DEFAULT_LOCALE)}
          onChangeLocale={setLocale}
        />
      ) : !category ? (
        <p role="status" className="text-muted-foreground mt-6 text-sm">
          Loading category…
        </p>
      ) : !products ? (
        <p role="status" className="text-muted-foreground mt-6 text-sm">
          Loading products…
        </p>
      ) : showUnavailable ? (
        <UnavailableInLanguage
          locale={locale ?? DEFAULT_LOCALE}
          noun="products"
          entity="category"
          onViewInEnglish={() => setLocale(DEFAULT_LOCALE)}
          onChangeLocale={setLocale}
        />
      ) : (
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

      {reason !== "missing-translation" && products && !showUnavailable && (
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
