import type { ReactNode } from "react";
import { Link } from "react-router";

import { ADMIN_CONTENT_WIDTH } from "./layout";
import { StoreHeader } from "./StoreHeader";

type AdminShellProps = {
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
};

// design.md § Decisions D8: StoreHeader's administration variant plus the
// content frame. The header reads the session itself (D2), so this no longer
// takes or forwards a username.
export function AdminShell({ backTo, backLabel, children }: AdminShellProps) {
  return (
    <div>
      <StoreHeader variant="admin" />

      <div className={`mx-auto ${ADMIN_CONTENT_WIDTH} px-6 py-16`}>
        {backTo && (
          <Link
            to={backTo}
            className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          >
            ← {backLabel ?? "Back to admin home"}
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
