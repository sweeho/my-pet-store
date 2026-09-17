import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/utils";

import type { OrderStatus } from "../../../admin/types";

// AC-2: the three the requirement names for a decision — never COMPLETED,
// which no row on the approval screen carries (this screen lists PENDING
// orders only; design.md § Decisions D8).
const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "APPROVED", "DENIED"];

// The colour-coded treatment per status (design.md § Decisions D9;
// SWHM-T-0209 PLAN.md step 4), following the mockup's
// .status-select.{pending,approved,denied} rules. The leading class on
// each entry is a stable, non-Tailwind marker — SWHM-T-0209 PLAN.md step 6
// asserts against it directly, never against a computed colour value that
// jsdom cannot resolve.
const STATUS_TRIGGER_CLASS: Record<OrderStatus, string> = {
  PENDING:
    "status-select-pending bg-status-pending-bg text-status-pending-fg border-status-pending-border",
  APPROVED:
    "status-select-approved bg-status-approved-bg text-status-approved-fg border-status-approved-border",
  DENIED:
    "status-select-denied bg-status-denied-bg text-status-denied-fg border-status-denied-border",
  COMPLETED: "",
};

// The option list's dot, coloured the same way the mockup's .dot.{status}
// rules colour it — a fill from the status's own -bg token and a ring from
// its -border token, distinguishing the three options even before reading
// their text.
const STATUS_DOT_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-status-pending-bg border-status-pending-border",
  APPROVED: "bg-status-approved-bg border-status-approved-border",
  DENIED: "bg-status-denied-bg border-status-denied-border",
  COMPLETED: "",
};

type StatusSelectProps = {
  value: OrderStatus;
  // Supplies the row-naming accessible label (PLAN.md step 6) — every
  // control in a row is named after that row's order, never just "Status".
  orderId: number;
  onChange: (next: OrderStatus) => void;
  disabled?: boolean;
};

// The per-row status control (design.md § Spec discrepancies S3 — the
// Swing combo-box cell editor's replacement). The status text always
// renders, in the trigger and in every option — colour is never the only
// cue (design.md § Decisions D9; WCAG 2.1 1.4.1), so the dot beside each
// option's text stays aria-hidden: decoration beside the text, never a
// replacement for it. Headless UI's Listbox handles the full
// pointer/focus/keyboard sequence itself; nothing here synthesizes a DOM
// event to drive it (PLAN.md step 7, ARCHITECTURE.md § Key Decisions).
export function StatusSelect({ value, orderId, onChange, disabled }: StatusSelectProps) {
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative inline-block">
        <ListboxButton
          aria-label={`Status for order ${orderId}`}
          className={cn(
            "flex h-8 w-[148px] items-center justify-between gap-1.5 rounded-md border px-2.5 text-[13px] font-medium tracking-wide",
            "disabled:opacity-50",
            // Focus/open treatment from the mockup's .status-select.open
            // rule: the ring replaces the status border while open.
            "data-open:border-ring data-open:ring-ring/45 data-open:ring-2",
            STATUS_TRIGGER_CLASS[value],
          )}
        >
          {value}
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 opacity-65" />
        </ListboxButton>
        <ListboxOptions className="border-border bg-card absolute z-10 mt-1 w-[148px] rounded-md border p-1 focus:outline-none">
          {STATUS_OPTIONS.map((status) => (
            <ListboxOption
              key={status}
              value={status}
              className="data-focus:bg-accent flex items-center justify-between gap-1.5 rounded-sm px-2 py-1.5 text-[13px] font-medium tracking-wide"
            >
              {({ selected }) => (
                <>
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn("size-2 rounded-full border", STATUS_DOT_CLASS[status])}
                    />
                    {status}
                  </span>
                  {selected && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
