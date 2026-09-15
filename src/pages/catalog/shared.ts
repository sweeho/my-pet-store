// Shared, non-page helpers for the catalog screens. A plain .ts file (not
// .tsx) so vite-plugin-pages — which only scans the tsx/jsx extensions
// configured in vite.config.ts — never registers it as a route.
import { useSearchParams } from "react-router";

import { DEFAULT_LOCALE } from "../../../catalog/locale";
import type { Locale, Page } from "../../../catalog/types";
import { readCookie, writeCookie } from "../../utils/cookies";

type ProfileResponse = { profile: { preferredLanguage: string } };

const LOCALE_COOKIE = "petstore_locale";
const LOCALE_PARAM = "locale";

// The single place that decides and changes the active catalogue locale
// (PLANNING-NOTES D2). Resolution order: the "locale" search param, the
// petstore_locale cookie, a signed-on customer's profile.preferredLanguage,
// then DEFAULT_LOCALE. The first two are synchronous, so a screen with
// either one present gets a locale immediately, without waiting on the
// /api/customer round trip; locale is null only while none of the three are
// available yet. A failed/401 profile read is a visitor fallback, never an
// error state (PLAN.md step 5), matching the pattern this hook already used.
export function useCatalogLocale(): {
  locale: Locale | null;
  setLocale: (next: Locale) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  // undefined: the /api/customer read hasn't resolved yet. null: it resolved
  // to "no session" (a visitor). A string: the signed-on customer's stored
  // preference — this also identifies "a session exists" for setLocale.
  const [profileLocale, setProfileLocale] = useState<Locale | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/customer")
      .then((response) => (response.ok ? (response.json() as Promise<ProfileResponse>) : null))
      .then((body) => {
        if (cancelled) return;
        setProfileLocale(body ? body.profile.preferredLanguage : null);
      })
      .catch(() => {
        if (!cancelled) setProfileLocale(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const paramLocale = searchParams.get(LOCALE_PARAM);
  const cookieLocale = readCookie(LOCALE_COOKIE);
  const hasSession = typeof profileLocale === "string";

  const locale: Locale | null =
    paramLocale ??
    cookieLocale ??
    (profileLocale === undefined ? null : (profileLocale ?? DEFAULT_LOCALE));

  function setLocale(next: Locale) {
    writeCookie(LOCALE_COOKIE, next);
    setSearchParams(
      (previous) => {
        const nextParams = new URLSearchParams(previous);
        nextParams.set(LOCALE_PARAM, next);
        return nextParams;
      },
      { replace: true },
    );
    document.documentElement.lang = next;

    // Fire-and-forget: a 401 means no session, which is the visitor path
    // this hook already treats as a fallback rather than an error (AC-4).
    if (hasSession) {
      fetch("/api/customer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { preferredLanguage: next } }),
      }).catch(() => {});
    }
  }

  return { locale, setLocale };
}

// Mirrors catalog/availability.ts's MissingReason — duplicated rather than
// imported because that module reaches db/client.ts at runtime, and pulling
// that into the browser bundle is not worth avoiding one type declaration
// (design.md D4).
export type MissingReason = "not-found" | "missing-translation";

type FetchResult<T> = { url: string; data: T | null; reason: MissingReason | null };

// Fetches `url` once it stops being null (callers pass null while a
// dependency, e.g. the resolved locale, isn't ready yet). A 404 reads the
// response body for the server's `reason` field rather than leaving the page
// on data === null forever (AC-6), so a screen can distinguish "no such
// thing" from "exists, not translated" (design.md RC/D1). A 404 body that is
// missing or fails to parse as JSON yields "not-found" — the safe direction,
// since guessing "missing-translation" would tell a visitor a page that
// genuinely doesn't exist is merely untranslated (design.md D2). State is
// only ever set from inside the fetch callback, never synchronously in the
// effect body (react-hooks/set-state-in-effect) — a url change is instead
// treated as "loading" by comparing the last resolved result's url against
// the current one at render time.
export function useCatalogFetch<T>(url: string | null): {
  data: T | null;
  reason: MissingReason | null;
} {
  const [result, setResult] = useState<FetchResult<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetch(url).then((response) => {
      if (cancelled) return;
      if (response.status === 404) {
        (response.json() as Promise<unknown>)
          .then((body) => {
            if (cancelled) return;
            const reason =
              body && typeof body === "object" && "reason" in body
                ? ((body as { reason: MissingReason }).reason ?? "not-found")
                : "not-found";
            setResult({ url, data: null, reason });
          })
          .catch(() => {
            if (!cancelled) setResult({ url, data: null, reason: "not-found" });
          });
        return;
      }
      (response.json() as Promise<T>).then((body) => {
        if (!cancelled) setResult({ url, data: body, reason: null });
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
