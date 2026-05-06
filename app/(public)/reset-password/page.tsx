import { Suspense } from "react";
import { AuthShell } from "../../../components/auth/auth-shell";
import { ResetPasswordForm } from "../../../components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Reset"
      title="Reset password"
      subtitle="Choose a new password for your account"
      switchText="Already reset it?"
      switchHref="/login"
      switchLabel="Login"
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading reset link...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
