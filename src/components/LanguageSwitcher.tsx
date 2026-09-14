import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Check, ChevronDown, Globe } from "lucide-react";

import { LANGUAGES } from "../../account/vocabulary";
import type { Locale } from "../../catalog/types";
import { Button } from "./ui";

// One list, not two (AC-5) — the profile form reads the same constant
// (src/pages/customer.tsx). Display names are a lookup keyed by locale code
// beside the component, since LANGUAGES itself only carries the codes.
const LANGUAGE_NAMES: Record<(typeof LANGUAGES)[number], string> = {
  en_US: "English (US)",
  ja_JP: "日本語",
  zh_CN: "中文",
};

type LanguageSwitcherProps = {
  locale: Locale;
  onChange: (next: Locale) => void;
  label?: string;
};

export function LanguageSwitcher({ locale, onChange, label }: LanguageSwitcherProps) {
  const currentName = LANGUAGE_NAMES[locale as (typeof LANGUAGES)[number]] ?? locale;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton as={Button} variant="outline" size="sm" className="gap-2">
        <Globe className="text-muted-foreground size-4" aria-hidden="true" />
        {label ?? currentName}
        <ChevronDown className="text-muted-foreground size-3.5" aria-hidden="true" />
      </MenuButton>
      <MenuItems className="border-border bg-card absolute right-0 z-10 mt-1.5 w-56 rounded-lg border p-1.5 shadow-lg focus:outline-none">
        {LANGUAGES.map((code) => {
          const isCurrent = code === locale;
          return (
            <MenuItem key={code}>
              <button
                type="button"
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onChange(code)}
                className="data-focus:bg-accent flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm"
              >
                <span>{LANGUAGE_NAMES[code]}</span>
                {isCurrent ? (
                  <Check className="size-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <span className="text-muted-foreground shrink-0 text-[11px] tracking-wide">
                    {code}
                  </span>
                )}
              </button>
            </MenuItem>
          );
        })}
        <p className="border-border text-muted-foreground mt-1 border-t px-2.5 pt-2 pb-1 text-[11px] leading-relaxed">
          Saved to your profile — applies on every visit.
        </p>
      </MenuItems>
    </Menu>
  );
}
