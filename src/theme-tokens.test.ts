import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REGRESSION GUARD
 *
 * Parses src/index.css directly rather than asserting on a rendered DOM:
 * the requirement is about token *definitions*, and jsdom does not resolve
 * oklch() or cascade custom properties in a way that would make a
 * rendered-page assertion meaningful. See
 * openspec/changes/swhm-s-0005-bugfix-swhm-t-0005-light-mod/design.md § D3.
 *
 * Path is resolved from process.cwd(), not import.meta.url, matching the
 * convention db/client.ts uses (AGENTS.md § Gotchas): this module is
 * transformed by Vite, so import.meta.url is not a real file:// URL.
 */

const CSS_PATH = path.resolve(process.cwd(), "src/index.css");

function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Could not find "${selector}" block in src/index.css`);
  const end = css.indexOf("}", start);
  return css.slice(start, end);
}

function extractVar(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}:\\s*(oklch\\([^)]*\\))`));
  if (!match) throw new Error(`Could not find ${name} in block`);
  return match[1];
}

// OKLCH -> linear sRGB -> WCAG 2.1 relative luminance, per the OKLab inverse
// matrix (see design.md § "Measured context").
function oklchToLuminance(oklch: string): number {
  const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) throw new Error(`Could not parse oklch value: ${oklch}`);
  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = (parseFloat(match[3]) * Math.PI) / 180;

  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toLinearSrgbChannel = (c: number): number => {
    const clamped = Math.min(Math.max(c, 0), 1);
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  const r = toLinearSrgbChannel(rLin);
  const g = toLinearSrgbChannel(gLin);
  const bChannel = toLinearSrgbChannel(bLin);

  const linearize = (c: number): number =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(bChannel);
}

function contrastRatio(oklchA: string, oklchB: string): number {
  const lumA = oklchToLuminance(oklchA);
  const lumB = oklchToLuminance(oklchB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("theme tokens — destructive pair", () => {
  const css = readFileSync(CSS_PATH, "utf-8");

  const themes = [
    { name: "light", selector: ":root" },
    { name: "dark", selector: ".dark" },
  ];

  it.each(themes)(
    "$name theme: --destructive and --destructive-foreground are different colours",
    ({ name, selector }) => {
      const block = extractBlock(css, selector);
      const bg = extractVar(block, "--destructive");
      const fg = extractVar(block, "--destructive-foreground");

      expect(
        bg,
        `[${name}] --destructive and --destructive-foreground must not be identical`,
      ).not.toBe(fg);
    },
  );

  it("light theme: destructive foreground clears WCAG AA (4.5:1) against destructive background", () => {
    const block = extractBlock(css, ":root");
    const bg = extractVar(block, "--destructive");
    const fg = extractVar(block, "--destructive-foreground");

    const ratio = contrastRatio(bg, fg);

    expect(
      ratio,
      `[light] --destructive/--destructive-foreground contrast is ${ratio.toFixed(2)}:1, below the 4.5:1 AA minimum`,
    ).toBeGreaterThanOrEqual(4.5);
  });
});

// Orders approval status tints (design.md § Decisions D9; SWHM-T-0209
// PLAN.md step 3) — covered the same way as the destructive pair above:
// distinctness in both themes, the contrast ratio in light.
describe("theme tokens — status pairs (pending, approved, denied)", () => {
  const css = readFileSync(CSS_PATH, "utf-8");

  const themes = [
    { name: "light", selector: ":root" },
    { name: "dark", selector: ".dark" },
  ];

  const statuses = ["pending", "approved", "denied"];

  for (const status of statuses) {
    it.each(themes)(
      `$name theme: --status-${status}-bg and --status-${status}-fg are different colours`,
      ({ name, selector }) => {
        const block = extractBlock(css, selector);
        const bg = extractVar(block, `--status-${status}-bg`);
        const fg = extractVar(block, `--status-${status}-fg`);

        expect(
          bg,
          `[${name}] --status-${status}-bg and --status-${status}-fg must not be identical`,
        ).not.toBe(fg);
      },
    );

    it(`light theme: --status-${status}-fg clears WCAG AA (4.5:1) against --status-${status}-bg`, () => {
      const block = extractBlock(css, ":root");
      const bg = extractVar(block, `--status-${status}-bg`);
      const fg = extractVar(block, `--status-${status}-fg`);

      const ratio = contrastRatio(bg, fg);

      expect(
        ratio,
        `[light] --status-${status}-bg/--status-${status}-fg contrast is ${ratio.toFixed(2)}:1, below the 4.5:1 AA minimum`,
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});
