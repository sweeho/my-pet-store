import type { ReactNode } from "react";
import { Link } from "react-router";

import { STORE_NAME } from "@/constants";
import { cn } from "@/utils";

import { ADMIN_ROLE } from "../../auth/protected-resources";
import { ADMIN_CONTENT_WIDTH, CONTENT_WIDTH } from "./layout";
import { StoreMark } from "./StoreMark";

// Fixed interface contract (PLAN.md § Fixed interface contracts) — consumed by SWHM-T-0237 and
// SWHM-T-0238, and not changed by either.
export type StoreHeaderProps = {
  /** "store" (default) on customer-facing screens; "admin" adds the administration label. */
  variant?: "store" | "admin";
  /** Trailing slot in the control row — the catalogue screens pass their LanguageSwitcher. */
  children?: ReactNode;
};

type SessionResponse = {
  j_signon: boolean;
  j_signon_username: string | null;
  original_url: string | null;
  role: string | null;
};

type CartResponse = { count: number };

const SIGNED_OUT_SESSION: SessionResponse = {
  j_signon: false,
  j_signon_username: null,
  original_url: null,
  role: null,
};

const controlClassName = "text-sm font-medium hover:underline underline-offset-4";

function CartLink({ count }: { count: number }) {
  return (
    <Link to="/cart" className={controlClassName}>
      Cart
      {count > 0 && (
        <span className="bg-secondary text-foreground ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}

// design.md § Decisions D5: says it is checking, claims nothing, and is deliberately not
// role="status" — the header is chrome on every screen, so a live region here would announce
// on every navigation (DESIGN.md § Page frame).
function PendingIdentity() {
  return <span className="text-muted-foreground text-sm">Checking your session…</span>;
}

function SignedOutIdentity() {
  return (
    <Link to="/signon" className={controlClassName}>
      Sign in
    </Link>
  );
}

function SignedOnIdentity({
  variant,
  username,
  role,
  onSignOut,
}: {
  variant: "store" | "admin";
  username: string;
  role: string | null;
  onSignOut: () => void;
}) {
  return (
    <>
      {variant === "store" && role === ADMIN_ROLE && (
        <Link
          to="/admin"
          className="border-border rounded-sm border px-2 py-0.5 text-sm font-semibold"
        >
          Admin
        </Link>
      )}
      <span className="text-muted-foreground text-sm">
        Signed in as <span className="text-foreground font-medium">{username}</span>
      </span>
      {variant === "store" && (
        <Link to="/customer" className={controlClassName}>
          My account
        </Link>
      )}
      <button type="button" onClick={onSignOut} className={controlClassName}>
        Sign out
      </button>
    </>
  );
}

export function StoreHeader({ variant = "store", children }: StoreHeaderProps) {
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/signon/session")
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((result) => {
        if (!cancelled) setSession(result);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/cart")
      .then((response) => response.json() as Promise<CartResponse>)
      .then((cart) => {
        if (!cancelled) setCartCount(cart.count);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    await fetch("/api/signon/logout", { method: "POST" });
    setSession(SIGNED_OUT_SESSION);
    navigate("/");
  }

  let identity: ReactNode;
  if (session === null) {
    identity = <PendingIdentity />;
  } else if (!session.j_signon || session.j_signon_username === null) {
    identity = <SignedOutIdentity />;
  } else {
    identity = (
      <SignedOnIdentity
        variant={variant}
        username={session.j_signon_username}
        role={session.role}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <header className="border-border border-b">
      <div
        className={cn(
          "mx-auto flex items-center gap-5 px-6 py-4",
          variant === "admin" ? ADMIN_CONTENT_WIDTH : CONTENT_WIDTH,
        )}
      >
        <Link to="/" className="flex items-center gap-2">
          <StoreMark className="h-7 w-auto" />
          <span className="sr-only">{STORE_NAME}</span>
        </Link>

        {variant === "store" && (
          <>
            <Link to="/catalog" className={controlClassName}>
              Catalog
            </Link>
            <CartLink count={cartCount} />
          </>
        )}

        {variant === "admin" && (
          <span className="text-muted-foreground text-sm">· Administration</span>
        )}

        <span className="flex-1" />

        {variant === "admin" && (
          <>
            <Link to="/catalog" className={controlClassName}>
              Catalog
            </Link>
            <CartLink count={cartCount} />
          </>
        )}

        {variant === "store" && children}

        <div className="flex items-center gap-3.5">{identity}</div>
      </div>
    </header>
  );
}
