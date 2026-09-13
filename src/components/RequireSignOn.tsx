import type { ReactNode } from "react";

type AccessCheckResult = { allowed: true } | { allowed: false; redirectTo: string };

type RequireSignOnProps = {
  children: ReactNode;
};

export function RequireSignOn({ children }: RequireSignOnProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/signon/check?resource=${encodeURIComponent(location.pathname)}`)
      .then((response) => response.json() as Promise<AccessCheckResult>)
      .then((result) => {
        if (cancelled) return;
        if (result.allowed) {
          setAllowed(true);
        } else {
          navigate(result.redirectTo);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  if (!allowed) {
    return (
      <div role="status" className="mx-auto max-w-[672px] p-6">
        Checking access…
      </div>
    );
  }
  return <>{children}</>;
}
