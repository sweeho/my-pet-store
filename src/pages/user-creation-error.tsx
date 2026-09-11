import { Link } from "react-router";

export default function UserCreationError() {
  const location = useLocation();
  const error = (location.state as { error?: string } | null)?.error ?? "Account creation failed.";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-foreground text-2xl font-bold">Account Creation Error</h1>
      <p className="text-destructive">{error}</p>
      <Link to="/signon" className="text-foreground text-sm underline-offset-4 hover:underline">
        ← Back to sign in
      </Link>
    </div>
  );
}
