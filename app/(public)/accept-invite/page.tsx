import { Suspense } from "react";
import { AuthShell } from "../../../components/auth/auth-shell";
import { AcceptInvitePanel } from "../../../components/auth/accept-invite-panel";

export default function AcceptInvitePage() {
  return (
    <AuthShell
      eyebrow="Invite"
      title="Accept project invite"
      subtitle="Join a shared Reqlens project"
      switchText="Wrong account?"
      switchHref="/login"
      switchLabel="Login"
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading invite...</p>}>
        <AcceptInvitePanel />
      </Suspense>
    </AuthShell>
  );
}
