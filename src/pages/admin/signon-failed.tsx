import { Link } from "react-router";

// Not wrapped in AdminShell: nobody reached this page signed in, and
// AdminShell's null-username state ("Signing in…") describes a check in
// flight, not a failure — the wrong copy for a static failure page. The
// header below mirrors admin/signon.tsx's, the other pre-auth admin screen
// (PLAN.md step 1).
export default function AdminSignOnFailed() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <div className="flex items-center gap-2">
        <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-sm text-xs font-bold">
          MPS
        </div>
        <span className="text-muted-foreground text-sm">My Pet Store · Administration</span>
      </div>
      <h1 className="text-foreground mt-2 text-2xl font-bold">Sign In Failed</h1>
      <p className="text-destructive">
        There were errors signing you in. The user name and password you entered were not found in
        our records. Please try again.
      </p>
      <Link
        to="/admin/signon"
        className="text-foreground text-sm underline-offset-4 hover:underline"
      >
        ← Back to sign in
      </Link>
    </div>
  );
}
