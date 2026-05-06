import { AuthShell } from "../../../components/auth/auth-shell";
import { ForgotPasswordForm } from "../../../components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Reset"
      title="Forgot password"
      subtitle="Enter your email and we will send a reset link"
      switchText="Remember your password?"
      switchHref="/login"
      switchLabel="Login"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
