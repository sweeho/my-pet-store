import { describe, expect, it } from "vitest";

import { decideApproval } from "./approval";

/**
 * UNIT TEST — decideApproval is a pure function (design.md § Decisions D1):
 * no database, no session, no currency conversion. Each locale's threshold
 * is exercised at, above and below its boundary — the threshold is
 * exclusive (`< 500`, not `<= 500`).
 */
describe("decideApproval", () => {
  it("AC-1: a US order under $500 is APPROVED", () => {
    expect(decideApproval("en_US", 300)).toBe("APPROVED");
  });

  it("AC-2: a US order over $500 is PENDING", () => {
    expect(decideApproval("en_US", 600)).toBe("PENDING");
  });

  it("en_US: the $500 boundary itself is PENDING (exclusive threshold)", () => {
    expect(decideApproval("en_US", 500)).toBe("PENDING");
  });

  it("en_US: just under $500 is APPROVED", () => {
    expect(decideApproval("en_US", 499.99)).toBe("APPROVED");
  });

  it("AC-3: a Japan order under ¥50,000 is APPROVED", () => {
    expect(decideApproval("ja_JP", 40000)).toBe("APPROVED");
  });

  it("AC-4: a Japan order over ¥50,000 is PENDING", () => {
    expect(decideApproval("ja_JP", 60000)).toBe("PENDING");
  });

  it("ja_JP: the 50,000 boundary itself is PENDING (exclusive threshold)", () => {
    expect(decideApproval("ja_JP", 50000)).toBe("PENDING");
  });

  it("ja_JP: just under 50,000 is APPROVED", () => {
    expect(decideApproval("ja_JP", 49999.99)).toBe("APPROVED");
  });

  it("a locale with no threshold (zh_CN) is PENDING, however small the amount", () => {
    expect(decideApproval("zh_CN", 1)).toBe("PENDING");
  });

  it("a null locale is PENDING, however small the amount", () => {
    expect(decideApproval(null, 1)).toBe("PENDING");
  });
});
