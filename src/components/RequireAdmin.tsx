import type { ReactNode } from "react";

type AccessCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "not-signed-on"; redirectTo: string }
  | { allowed: false; reason: "role-required"; requiredRole: string };

type RequireAdminProps = {
  children: ReactNode;
};

export function RequireAdmin({ children }: RequireAdminProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<AccessCheckResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/signon/check?resource=${encodeURIComponent(location.pathname)}`)
      .then((response) => response.json() as Promise<AccessCheckResult>)
      .then((checked) => {
        if (cancelled) return;
        if (!checked.allowed && checked.reason === "not-signed-on") {
          navigate(checked.redirectTo);
          return;
        }
        setResult(checked);
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  if (result === null) {
    return (
      <div role="status" className="mx-auto max-w-[672px] p-6">
        Checking access…
      </div>
    );
  }

  if (!result.allowed) {
    return (
      <div role="alert" className="mx-auto max-w-[672px] p-6">
        You don&apos;t have permission to view this page.
      </div>
    );
  }

  return <>{children}</>;
}
