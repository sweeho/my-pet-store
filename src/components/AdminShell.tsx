import type { ReactNode } from "react";
import { Link } from "react-router";

import { StoreMark } from "./StoreMark";

type AdminShellProps = {
  username: string | null;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
};

export function AdminShell({ username, backTo, backLabel, children }: AdminShellProps) {
  return (
    <div>
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-[52rem] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <StoreMark className="h-7 w-auto" />
            <span className="text-muted-foreground text-sm">· Administration</span>
          </div>
          {username !== null ? (
            <span className="text-muted-foreground text-sm">
              Signed in as <span className="text-foreground font-medium">{username}</span>
            </span>
          ) : (
            <span role="status" className="text-muted-foreground text-sm">
              Signing in…
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[52rem] px-6 py-16">
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
