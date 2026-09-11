// Pagination, fixed in artifacts/SWHM-S-0004/INTERFACES.md § Pagination.
import type { Page } from "./types";

export const EMPTY_PAGE: Page<never> = { objects: [], start: 0, hasNext: false };

// `rows` is at most count+1 rows starting at `start` — the caller's job, never this
// module's. hasNext is derived from the extra row's presence, never a COUNT query.
export function buildPage<T>(rows: T[], start: number, count: number): Page<T> {
  if (start < 0 || count < 1 || rows.length === 0) {
    return EMPTY_PAGE;
  }

  return {
    objects: rows.slice(0, count),
    start,
    hasNext: rows.length > count,
  };
}

export function hasPrevious(page: Page<unknown>): boolean {
  return page.start > 0;
}
