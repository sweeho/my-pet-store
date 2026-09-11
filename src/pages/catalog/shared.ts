// Shared, non-page helpers for the catalog screens. A plain .ts file (not
// .tsx) so vite-plugin-pages — which only scans the tsx/jsx extensions
// configured in vite.config.ts — never registers it as a route.
import { DEFAULT_LOCALE } from "../../../catalog/locale";
import type { Locale, Page } from "../../../catalog/types";

type ProfileResponse = { profile: { preferredLanguage: string } };

// Resolves the catalog locale once: a signed-on customer's stored
// preferredLanguage, or DEFAULT_LOCALE for a visitor with no session. The
// catalog itself requires no session, so a failed/401 profile read is a
// fallback, never an error state (PLAN.md step 5).
export function useCatalogLocale(): Locale | null {
  const [locale, setLocale] = useState<Locale | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/customer")
      .then((response) => (response.ok ? (response.json() as Promise<ProfileResponse>) : null))
      .then((body) => {
        if (cancelled) return;
        setLocale(body ? body.profile.preferredLanguage : DEFAULT_LOCALE);
      })
      .catch(() => {
        if (!cancelled) setLocale(DEFAULT_LOCALE);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return locale;
}

type FetchResult<T> = { url: string; data: T | null; notFound: boolean };

// Fetches `url` once it stops being null (callers pass null while a
// dependency, e.g. the resolved locale, isn't ready yet). A 404 sets
// notFound rather than leaving the page on data === null forever (AC-6).
// State is only ever set from inside the fetch callback, never
// synchronously in the effect body (react-hooks/set-state-in-effect) — a
// url change is instead treated as "loading" by comparing the last
// resolved result's url against the current one at render time.
export function useCatalogFetch<T>(url: string | null): { data: T | null; notFound: boolean } {
  const [result, setResult] = useState<FetchResult<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetch(url).then((response) => {
      if (cancelled) return;
      if (response.status === 404) {
        setResult({ url, data: null, notFound: true });
        return;
      }
      (response.json() as Promise<T>).then((body) => {
        if (!cancelled) setResult({ url, data: body, notFound: false });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!result || result.url !== url) {
    return { data: null, notFound: false };
  }
  return { data: result.data, notFound: result.notFound };
}

// The two neighbouring starts a Page's own start/hasNext license — null
// when that direction has nowhere to go, so a page never has to recompute
// hasNext/start itself (PLAN.md step 3).
export function paginationLinks(
  page: Page<unknown>,
  count: number,
): { prevStart: number | null; nextStart: number | null } {
  return {
    prevStart: page.start > 0 ? Math.max(0, page.start - count) : null,
    nextStart: page.hasNext ? page.start + count : null,
  };
}
