import { Link } from "react-router";

import { StoreHeader } from "@/components";
import { CONTENT_WIDTH } from "@/components/layout";
import { cn } from "@/utils";

export default function UserCreationError() {
  const location = useLocation();
  const error = (location.state as { error?: string } | null)?.error ?? "Account creation failed.";

  return (
    <>
      <StoreHeader />
      <div className={cn(CONTENT_WIDTH, "mx-auto flex flex-col gap-4 p-6")}>
        <h1 className="text-foreground text-2xl font-bold">Account Creation Error</h1>
        <p className="text-destructive">{error}</p>
        <Link to="/signon" className="text-foreground text-sm underline-offset-4 hover:underline">
          ← Back to sign in
        </Link>
      </div>
    </>
  );
}
