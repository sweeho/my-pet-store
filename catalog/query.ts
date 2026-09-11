// The one module that knows how a catalogue query is built — pagination, the
// locale join and the search predicate each have a single definition here
// (design.md § Planning record, D5). Services describe what they read; this
// module is the only place that says how it is paged, joined or matched.
import { and, eq, or, sql, type SQL } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

import type { Locale, Page } from "./types";
import { buildPage, EMPTY_PAGE } from "./page";
import { readConsistent } from "./transaction";

// Requests at most count+1 rows via limit/offset — the "+1" lives here and
// nowhere else (D3) — inside one readConsistent transaction, so a page's
// rows and its hasNext flag always come from the same snapshot.
export function paginatedQuery<T>(
  build: (limit: number, offset: number) => T[],
  start: number,
  count: number,
): Page<T> {
  if (start < 0 || count < 1) {
    return EMPTY_PAGE;
  }

  const rows = readConsistent(() => build(count + 1, start));
  return buildPage(rows, start, count);
}

// The single definition of the locale-matching condition, so two services
// can never filter a locale differently.
export function localeJoin(detailsTable: { locale: AnySQLiteColumn }, locale: Locale): SQL {
  return eq(detailsTable.locale, locale);
}

// SQLite's LIKE is case-insensitive for ASCII by default, so no LOWER() is
// needed on either side to satisfy "matching is case-insensitive".
// Escapes `%`, `_` and the escape character itself so a keyword containing
// one matches literally instead of as a wildcard — the legacy concatenated
// keywords straight into its LIKE clauses (design.md § Spec discrepancies,
// S6); that is the one behaviour not copied here.
function escapeLikeKeyword(keyword: string): string {
  return keyword.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

// AND across keywords, OR across fields — every field is checked for every
// keyword, and every keyword must match at least one field.
export function searchPredicate(keywords: string[], fields: AnySQLiteColumn[]): SQL | undefined {
  const perKeyword = keywords.map((keyword) => {
    const pattern = `%${escapeLikeKeyword(keyword)}%`;
    return or(...fields.map((field) => sql`${field} like ${pattern} escape '\\'`));
  });

  return and(...perKeyword);
}
