import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REGRESSION GUARD — SWHM-T-0239
 *
 * design.md § Decisions D3: nothing in a file's text distinguishes a screen
 * from a component, so every non-test .tsx file under src/pages must be
 * classified by hand as either an intended screen (INTENDED_SCREENS below)
 * or excluded from route generation (vite.config.ts's Pages({ exclude })).
 * A new file that is neither fails this guard, naming the file, rather than
 * silently shipping as a public route the way NotFound.tsx and
 * RootErrorBoundary.tsx did.
 *
 * Reads vite.config.ts as text rather than importing a shared constant
 * (design.md D4): src/ and vite.config.ts sit in different tsconfig
 * projects (tsconfig.json vs. tsconfig.node.json), both composite, and a
 * shared import would cross that project boundary. Follows the same
 * source-as-text technique as src/layout-width.test.ts and
 * src/palette-classes.test.ts (design.md F7).
 */
const INTENDED_SCREENS = new Set([
  "src/pages/[...all].tsx",
  "src/pages/about.tsx",
  "src/pages/admin/index.tsx",
  "src/pages/admin/orders-approval.tsx",
  "src/pages/admin/orders.tsx",
  "src/pages/admin/reports/orders.tsx",
  "src/pages/admin/reports/revenue.tsx",
  "src/pages/admin/signon-failed.tsx",
  "src/pages/admin/signon.tsx",
  "src/pages/cart.tsx",
  "src/pages/catalog/category/[categoryId].tsx",
  "src/pages/catalog/index.tsx",
  "src/pages/catalog/item/[itemId].tsx",
  "src/pages/catalog/product/[productId].tsx",
  "src/pages/customer.tsx",
  "src/pages/enter-order-information.tsx",
  "src/pages/index.tsx",
  "src/pages/order-completed.tsx",
  "src/pages/payment.tsx",
  "src/pages/signon-failed.tsx",
  "src/pages/signon-welcome.tsx",
  "src/pages/signon.tsx",
  "src/pages/supplier/index.tsx",
  "src/pages/supplier/inventory.tsx",
  "src/pages/user-creation-error.tsx",
]);

function pageFiles(): string[] {
  return execFileSync("git", ["ls-files", "src/pages"], { encoding: "utf8" })
    .split("\n")
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"));
}

// Pulls the literal glob strings out of vite.config.ts's Pages({ exclude })
// array and reduces each `**/<name>` entry to the basename it excludes. The
// *.test.* globs are dropped — pageFiles() already filters test files, so
// they'd never be checked against this set anyway.
function excludedBasenames(): Set<string> {
  const configSource = readFileSync(path.resolve(process.cwd(), "vite.config.ts"), "utf8");
  const match = configSource.match(/exclude:\s*\[([^\]]*)\]/);
  if (!match) throw new Error("Could not find Pages({ exclude: [...] }) in vite.config.ts");

  const patterns = [...match[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  return new Set(
    patterns
      .filter((p) => p.startsWith("**/") && !p.includes(".test."))
      .map((p) => p.slice("**/".length)),
  );
}

describe("page route inventory — every page file is classified", () => {
  const excluded = excludedBasenames();
  const offenders = pageFiles().filter(
    (file) => !excluded.has(path.basename(file)) && !INTENDED_SCREENS.has(file),
  );

  it("every .tsx file under src/pages is an intended screen or excluded from route generation", () => {
    expect(
      offenders,
      `unclassified page file(s) — add to INTENDED_SCREENS in src/page-routes.test.ts if this ` +
        `is a screen, or to vite.config.ts's Pages({ exclude }) if it is not: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
