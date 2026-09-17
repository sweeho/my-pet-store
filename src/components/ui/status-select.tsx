import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/utils";

import type { OrderStatus } from "../../../admin/types";

// AC-2: the three the requirement names for a decision — never COMPLETED,
// which no row on the approval screen carries (this screen lists PENDING
// orders only; design.md § Decisions D8).
const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "APPROVED", "DENIED"];

type StatusSelectProps = {
  value: OrderStatus;
  // Supplies the row-naming accessible label (PLAN.md step 6) — every
  // control in a row is named after that row's order, never just "Status".
  orderId: number;
  onChange: (next: OrderStatus) => void;
  disabled?: boolean;
};

// The per-row status control (design.md § Spec discrepancies S3 — the
// Swing combo-box cell editor's replacement). Colour is SWHM-T-0209's;
// this renders the neutral surface only (PLAN.md step 5). The status text
// always renders, in the trigger and in every option — colour is never the
// only cue (design.md § Decisions D9). Headless UI's Listbox handles the
// full pointer/focus/keyboard sequence itself; nothing here synthesizes a
// DOM event to drive it (PLAN.md step 7, ARCHITECTURE.md § Key Decisions).
export function StatusSelect({ value, orderId, onChange, disabled }: StatusSelectProps) {
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative inline-block">
        <ListboxButton
          aria-label={`Status for order ${orderId}`}
          className={cn(
            "border-input bg-background flex h-8 w-[148px] items-center justify-between gap-1.5 rounded-md border px-2.5 text-[13px] font-medium tracking-wide",
            "disabled:opacity-50",
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
                    <span aria-hidden="true" className="bg-muted-foreground size-2 rounded-full" />
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
