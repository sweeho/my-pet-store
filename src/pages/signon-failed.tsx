import { Link } from "react-router";

export default function SignOnFailed() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-foreground text-2xl font-bold">Sign In Failed</h1>
      <p className="text-destructive">
        There were errors signing you in. The user name and password you entered were not found in
        our records. Please try again.
      </p>
      <Link to="/signon" className="text-foreground text-sm underline-offset-4 hover:underline">
        ← Back to sign in
      </Link>
    </div>
  );
}
