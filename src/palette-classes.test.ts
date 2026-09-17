import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REGRESSION GUARD
 *
 * design.md § Decisions D11 — the home page and About page are the two
 * screens this ticket moves onto the store's design tokens (src/index.css),
 * so this scans exactly those two sources for a raw Tailwind palette class
 * rather than the token-backed classes (bg-background, text-foreground,
 * text-muted-foreground, border-border, ...). Follows
 * src/theme-tokens.test.ts (F14): a plain Vitest file asserting a property
 * of the codebase, not of a rendered component.
 *
 * Matches any *-{colour}-{shade} utility across the standard Tailwind
 * palette (bg/text/border/ring/from/via/to/fill/stroke), plus a bare
 * bg-white/text-white/bg-black/text-black — the exact "no grey, indigo, or
 * bare white" wording in the acceptance criteria is illustrative, not
 * exhaustive; a raw amber or rose class is just as much a one-off.
 */
const SCANNED_FILES = ["src/pages/index.tsx", "src/pages/about.tsx"];

const PALETTE_COLOURS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
].join("|");

const RAW_PALETTE_CLASS = new RegExp(
  `\\b(?:bg|text|border|ring|from|via|to|fill|stroke|decoration|outline|divide|accent|caret)-(?:${PALETTE_COLOURS})-\\d{2,3}\\b|\\b(?:bg|text|border)-(?:white|black)\\b`,
);

describe("home and About use the design tokens, not a raw palette colour", () => {
  it.each(SCANNED_FILES)("%s contains no raw Tailwind palette colour class", (file) => {
    const source = readFileSync(path.resolve(process.cwd(), file), "utf8");
    const match = source.match(RAW_PALETTE_CLASS);

    expect(match, `${file} still uses a raw palette class: ${match?.[0]}`).toBeNull();
  });
});
