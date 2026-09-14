import { STORE_NAME } from "@/constants";
import { cn } from "@/utils/cn";

type StoreMarkProps = {
  className?: string;
};

/**
 * In-repo, store-branded mark replacing the Tailwind Plus template's
 * hotlinked demo logo (tailwindcss.com). Renders from currentColor so it
 * reads on the dark header, and the whole thing is aria-hidden because the
 * surrounding <a>'s sr-only span already carries the link's accessible name.
 */
export function StoreMark({ className }: StoreMarkProps) {
  return (
    <span aria-hidden="true" className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-full w-auto shrink-0">
        <path d="M16 3 4 9v14l12 6 12-6V9Zm0 3.4 8.4 4.2L16 14.8 7.6 10.6ZM6 11.2l9 4.5v10.6l-9-4.5Zm11 15.1V15.7l9-4.5v10.6Z" />
      </svg>
      <span className="truncate text-base font-semibold whitespace-nowrap">{STORE_NAME}</span>
    </span>
  );
}
