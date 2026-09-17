import { describe, expect, it } from "vitest";

import type { MessageInput, NotificationRecipient } from "./types";
import { buildMessage } from "./message";

/**
 * UNIT TEST — no database, no fixture; buildMessage is a pure function.
 *
 * PLAN.md step 6: the three facts present for each kind; the three
 * subjects distinct; the no-name, given-name-only and family-name-only
 * cases.
 */

const RECIPIENT: NotificationRecipient = {
  email: "ada@example.com",
  givenName: "Ada",
  familyName: "Lovelace",
};

function input(overrides: Partial<MessageInput> = {}): MessageInput {
  return {
    orderId: 42,
    kind: "APPROVAL",
    status: "APPROVED",
    recipient: RECIPIENT,
    to: "ada@example.com",
    ...overrides,
  };
}

describe("buildMessage", () => {
  it("AC-1/AC-2 MSG-01: an APPROVAL body names the order id, customer name and status", () => {
    const message = buildMessage(input({ kind: "APPROVAL", orderId: 42, status: "APPROVED" }));

    expect(message.body).toContain("42");
    expect(message.body).toContain("Ada Lovelace");
    expect(message.body).toContain("APPROVED");
  });

  it("AC-1/AC-2 MSG-02: a DENIAL body names the order id, customer name and status", () => {
    const message = buildMessage(input({ kind: "DENIAL", orderId: 7, status: "DENIED" }));

    expect(message.body).toContain("7");
    expect(message.body).toContain("Ada Lovelace");
    expect(message.body).toContain("DENIED");
  });

  it("AC-1/AC-2 MSG-03: a COMPLETION body names the order id, customer name and status", () => {
    const message = buildMessage(input({ kind: "COMPLETION", orderId: 99, status: "COMPLETED" }));

    expect(message.body).toContain("99");
    expect(message.body).toContain("Ada Lovelace");
    expect(message.body).toContain("COMPLETED");
  });

  it("AC-2 MSG-04: the three kinds' subjects are pairwise distinct", () => {
    const approval = buildMessage(input({ kind: "APPROVAL" })).subject;
    const denial = buildMessage(input({ kind: "DENIAL" })).subject;
    const completion = buildMessage(input({ kind: "COMPLETION" })).subject;

    expect(new Set([approval, denial, completion]).size).toBe(3);
  });

  it("AC-2 MSG-05: buildMessage returns the given `to` address unchanged, for each kind", () => {
    for (const kind of ["APPROVAL", "DENIAL", "COMPLETION"] as const) {
      expect(buildMessage(input({ kind, to: "someone@example.com" })).to).toBe(
        "someone@example.com",
      );
    }
  });

  it("AC-3 MSG-06: an account with no given or family name still names the order id and status, with no empty or placeholder name fragment", () => {
    const noName: NotificationRecipient = {
      email: "x@example.com",
      givenName: null,
      familyName: null,
    };
    const message = buildMessage(input({ recipient: noName, orderId: 5, status: "APPROVED" }));

    expect(message.body).toContain("5");
    expect(message.body).toContain("APPROVED");
    expect(message.body).not.toMatch(/null/i);
    expect(message.body).not.toMatch(/undefined/i);
    expect(message.body).not.toMatch(/Dear\s*,/i);
    expect(message.body).not.toMatch(/Dear\s+,/i);
  });

  it("AC-3 MSG-07: a given-name-only recipient is addressed by the given name alone, with no trailing name fragment", () => {
    const givenOnly: NotificationRecipient = {
      email: "x@example.com",
      givenName: "Ada",
      familyName: null,
    };
    const message = buildMessage(input({ recipient: givenOnly }));

    expect(message.body).toContain("Ada");
    expect(message.body).not.toMatch(/null/i);
    expect(message.body).not.toContain("Ada ,");
    expect(message.body).not.toContain("Ada  ");
  });

  it("AC-3 MSG-08: a family-name-only recipient is addressed by the family name alone, with no leading name fragment", () => {
    const familyOnly: NotificationRecipient = {
      email: "x@example.com",
      givenName: null,
      familyName: "Lovelace",
    };
    const message = buildMessage(input({ recipient: familyOnly }));

    expect(message.body).toContain("Lovelace");
    expect(message.body).not.toMatch(/null/i);
    expect(message.body).not.toContain(", Lovelace");
    expect(message.body).not.toContain("  Lovelace");
  });

  it("AC-4 MSG-09: is callable with plain object literals — no database, no fixture", () => {
    expect(() =>
      buildMessage({
        orderId: 1,
        kind: "APPROVAL",
        status: "APPROVED",
        recipient: { email: null, givenName: null, familyName: null },
        to: "fallback@example.com",
      }),
    ).not.toThrow();
  });
});
