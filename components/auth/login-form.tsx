"use client";

import { FormEvent, useState } from "react";
import { authClient, AuthResult } from "../../lib/auth-client";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

export function LoginForm() {
  const [status, setStatus] = useState("Ready.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("Signing in...");

    const result = (await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password"))
    })) as AuthResult;

    setStatus(result.error?.message ?? result.error?.statusText ?? "Signed in.");
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <TextInput
        autoComplete="email"
        defaultValue="demo@reqlens.local"
        label="Email"
        name="email"
        required
        type="email"
      />
      <TextInput
        autoComplete="current-password"
        defaultValue="password1234"
        label="Password"
        name="password"
        required
        type="password"
      />
      <button className="text-left text-sm text-muted transition hover:text-foreground" type="button">
        Forgot Password?
      </button>
      <Button className="mt-4 w-full" type="submit">
        Login
      </Button>
      <p className="min-h-6 text-sm text-muted">{status}</p>
    </form>
  );
}
