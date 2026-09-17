import { describe, expect, it } from "vitest";

import { recordingTransport } from "./transport";
import type { MailMessage } from "./types";

/**
 * UNIT TEST — no database. PLAN.md step 5: the default transport records
 * the message it is handed rather than delivering it anywhere.
 */

describe("recordingTransport", () => {
  it("AC-8 / TR-01: records the message handed to it instead of delivering it", () => {
    const message: MailMessage = {
      to: "ada@example.com",
      subject: "Your order #42 has been approved",
      body: "Dear Ada,\n\nYour order has been approved.",
    };

    recordingTransport.send(message);

    expect(recordingTransport.sent).toContainEqual(
      expect.objectContaining({ ...message, sentAt: expect.any(Date) }),
    );
  });

  it("TR-02: send does not throw for an ordinary message", () => {
    expect(() =>
      recordingTransport.send({ to: "grace@example.com", subject: "s", body: "b" }),
    ).not.toThrow();
  });
});
