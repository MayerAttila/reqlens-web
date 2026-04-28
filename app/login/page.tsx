import { AuthShell } from "../../components/auth/auth-shell";
import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Login"
      title="Login"
      subtitle="Enter your account details"
      switchText="Don't have an account?"
      switchHref="/signup"
      switchLabel="Sign up"
    >
      <LoginForm />
    </AuthShell>
  );
}
