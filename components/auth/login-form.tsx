"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

export function LoginForm() {
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const toastId = toast.loading("Logging in...");

    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("email")),
        password: String(formData.get("password")),
      });

      if (result.error) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: result.error.message ?? "Could not log in.",
          type: "error",
        });
        return;
      }

      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Logged in.",
        type: "success",
      });
      router.push("/dashboard");
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the auth server.",
        type: "error",
      });
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <TextInput
        autoComplete="email"
        name="email"
        placeholder="Email"
        required
        type="email"
      />
      <TextInput
        autoComplete="current-password"
        name="password"
        placeholder="Password"
        required
        type="password"
      />
      <button
        className="text-left text-sm text-muted transition hover:text-foreground"
        type="button"
      >
        Forgot Password?
      </button>
      <Button className="mt-4 w-full" type="submit">
        Login
      </Button>
    </form>
  );
}
