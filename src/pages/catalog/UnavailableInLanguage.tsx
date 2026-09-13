// Shared "content doesn't exist in this language yet" message, used by the
// category and product screens (an empty list) and the item screen (a
// missing-translation 404) — DESIGN.md § Unavailable content states.
import { LANGUAGES } from "../../../account/vocabulary";
import type { Locale } from "../../../catalog/types";
import { Button } from "@/components";

// Mirrors LanguageSwitcher's own display names (src/components/LanguageSwitcher.tsx),
// duplicated rather than imported so this component depends only on its own
// props — the language is named in its own script, never as a locale code.
const LANGUAGE_NAMES: Record<(typeof LANGUAGES)[number], string> = {
  en_US: "English (US)",
  ja_JP: "日本語",
  zh_CN: "中文",
};

// The container a list's plural noun belongs to: a category lists products,
// a product lists items.
const CONTAINER_NOUN: Record<"products" | "items", string> = {
  products: "category",
  items: "product",
};

// The id every catalogue screen mounts its LanguageSwitcher under, so the
// "Change language" action below can open it without a second callback prop.
export const LANGUAGE_SWITCHER_MOUNT_ID = "catalog-language-switcher";

type UnavailableInLanguageProps = {
  locale: Locale;
  noun?: "products" | "items";
  onViewInEnglish: () => void;
};

export function UnavailableInLanguage({
  locale,
  noun,
  onViewInEnglish,
}: UnavailableInLanguageProps) {
  const languageName = LANGUAGE_NAMES[locale as (typeof LANGUAGES)[number]] ?? locale;
  const container = noun ? CONTAINER_NOUN[noun] : "item";
  const heading = noun
    ? `No ${noun} in ${languageName} yet`
    : `Not available in ${languageName} yet`;
  const subject = noun ? `the ${noun} exist` : "it exists";
  const body = `This ${container} has nothing translated into ${languageName}. Nothing has gone wrong — ${subject}, but not in this language.`;

  function openLanguageSwitcher() {
    document
      .getElementById(LANGUAGE_SWITCHER_MOUNT_ID)
      ?.querySelector<HTMLButtonElement>("button")
      ?.click();
  }

  return (
    <div className="border-border bg-muted mt-6 rounded-lg border p-6 text-center">
      <h2 className="text-foreground text-[15px] font-medium">{heading}</h2>
      <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">{body}</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={onViewInEnglish}>View in English (US)</Button>
        <Button variant="outline" onClick={openLanguageSwitcher}>
          Change language
        </Button>
      </div>
    </div>
  );
}
