import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StatusSelect } from "./status-select";

/**
 * UI COMPONENT TEST
 *
 * PLAN.md step 9: opening a row's status control reveals exactly PENDING,
 * APPROVED and DENIED (AC-2), and every control is named after its row's
 * order, never just "Status" (PLAN.md step 6). Located by role and
 * accessible name throughout, never by class name (PLAN.md step 9) — no
 * synthesized DOM event, a full pointer sequence via userEvent (PLAN.md
 * step 7).
 *
 * jsdom has no ResizeObserver, which Headless UI's Listbox uses internally
 * to track its trigger's position; this stub is the standard workaround,
 * scoped to this file rather than the shared test setup since no other
 * component in this codebase uses Listbox yet.
 */
if (typeof ResizeObserver === "undefined") {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
describe("StatusSelect", () => {
  it("SS-01: the trigger is named after its row's order, not just 'Status'", () => {
    render(<StatusSelect value="PENDING" orderId={1047} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Status for order 1047" })).toBeInTheDocument();
  });

  it("SS-02: the trigger shows the current status as text", () => {
    render(<StatusSelect value="DENIED" orderId={1046} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Status for order 1046" })).toHaveTextContent(
      "DENIED",
    );
  });

  it("AC-2 / SS-03: opening the control reveals exactly PENDING, APPROVED and DENIED", async () => {
    const user = userEvent.setup();
    render(<StatusSelect value="PENDING" orderId={1047} onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Status for order 1047" }));

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["PENDING", "APPROVED", "DENIED"]);
  });

  it("SS-04: choosing an option calls onChange with that status, never a synthesized event", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusSelect value="PENDING" orderId={1047} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Status for order 1047" }));
    await user.click(screen.getByRole("option", { name: "APPROVED" }));

    expect(onChange).toHaveBeenCalledWith("APPROVED");
  });

  it("SS-05: a disabled control's trigger cannot be opened", () => {
    render(<StatusSelect value="PENDING" orderId={1047} onChange={vi.fn()} disabled />);

    expect(screen.getByRole("button", { name: "Status for order 1047" })).toBeDisabled();
  });
});

// AC-1 / AC-2 (SWHM-T-0209): each status renders its own status class, and
// the status text is present in every case. Asserted by accessible text and
// by the semantic class the component applies — never by a computed colour
// value, which jsdom cannot resolve from a CSS custom property (PLAN.md
// step 6).
describe("StatusSelect — status colour coding (SWHM-T-0209)", () => {
  it.each([
    ["PENDING", "status-select-pending"],
    ["APPROVED", "status-select-approved"],
    ["DENIED", "status-select-denied"],
  ] as const)("AC-1: %s renders the %s class on its trigger", (status, statusClass) => {
    render(<StatusSelect value={status} orderId={1047} onChange={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "Status for order 1047" });
    expect(trigger).toHaveClass(statusClass);
  });

  it.each([
    ["PENDING", "status-select-approved"],
    ["APPROVED", "status-select-pending"],
    ["DENIED", "status-select-pending"],
  ] as const)(
    "AC-2: %s's trigger does not also carry another status's class (%s)",
    (status, otherStatusClass) => {
      render(<StatusSelect value={status} orderId={1047} onChange={vi.fn()} />);

      const trigger = screen.getByRole("button", { name: "Status for order 1047" });
      expect(trigger).not.toHaveClass(otherStatusClass);
    },
  );

  it.each(["PENDING", "APPROVED", "DENIED"] as const)(
    "AC-2: %s's status text is still rendered in the trigger, colour is never the only cue",
    (status) => {
      render(<StatusSelect value={status} orderId={1047} onChange={vi.fn()} />);

      expect(screen.getByRole("button", { name: "Status for order 1047" })).toHaveTextContent(
        status,
      );
    },
  );
});
