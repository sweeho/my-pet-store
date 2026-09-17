import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * REGRESSION GUARD
 *
 * design.md § Decisions D6 and D11: there are exactly two shared content
 * widths, each declared once in src/components/layout.ts
 * (CONTENT_WIDTH/ADMIN_CONTENT_WIDTH), and no screen under src/pages may
 * declare a column width of its own. Follows src/theme-tokens.test.ts
 * (F14): a plain Vitest file asserting a property of the codebase, not of a
 * rendered component — a browser or component test can't see a class that
 * was never rendered because it was removed correctly.
 *
 * The signal a page-level container declares its own width is the literal
 * `mx-auto max-w-...` pairing this codebase's page containers use — the two
 * classes adjacent, `mx-auto` first — with the two tokens right next to
 * each other in the source (see any src/pages/*.tsx before this ticket).
 * Checking for a bare `max-w-` anywhere in a file would also flag an
 * unrelated element's own sizing that happens to sit near an unrelated
 * `mx-auto` (e.g. cart.tsx's centred empty-cart copy, `mx-auto mt-1.5
 * max-w-[380px]`), which is not a column-width declaration. The imported
 * shared constants (CONTENT_WIDTH/ADMIN_CONTENT_WIDTH) are identifiers, not
 * the literal text "max-w-", so a page using them textually contains
 * neither token next to the other.
 *
 * The four sign-on screens keep their own `max-w-md` centred card
 * (design.md D6) and are exempted by path, not by pattern.
 */
const EXEMPT_PATHS = new Set([
  "src/pages/signon.tsx",
  "src/pages/signon-failed.tsx",
  "src/pages/admin/signon.tsx",
  "src/pages/admin/signon-failed.tsx",
]);

const MX_AUTO_MAX_W = /\bmx-auto max-w-/;

function pageFiles(): string[] {
  return execFileSync("git", ["ls-files", "src/pages"], { encoding: "utf8" })
    .split("\n")
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"));
}

describe("shared content column width — no page declares its own", () => {
  const offenders = pageFiles()
    .filter((file) => !EXEMPT_PATHS.has(file))
    .filter((file) => MX_AUTO_MAX_W.test(readFileSync(file, "utf8")));

  it("no screen under src/pages declares a page-level container max-w-* of its own", () => {
    expect(
      offenders,
      `screen(s) declaring their own column width: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
