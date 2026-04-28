import { AuthShell } from "../../components/auth/auth-shell";
import { SignupForm } from "../../components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Sign up"
      title="Create account"
      subtitle="Start monitoring API calls in minutes"
      switchText="Already have an account?"
      switchHref="/login"
      switchLabel="Login"
    >
      <SignupForm />
    </AuthShell>
  );
}
