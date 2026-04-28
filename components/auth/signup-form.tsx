"use client";

import { FormEvent, useState } from "react";
import { authClient, AuthResult } from "../../lib/auth-client";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

export function SignupForm() {
  const [status, setStatus] = useState("Ready.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("Creating account...");

    const result = (await authClient.signUp.email({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password"))
    })) as AuthResult;

    setStatus(result.error?.message ?? result.error?.statusText ?? "Account created.");
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <TextInput
        autoComplete="name"
        defaultValue="Demo User"
        label="Name"
        name="name"
        required
      />
      <TextInput
        autoComplete="email"
        defaultValue="demo@reqlens.local"
        label="Email"
        name="email"
        required
        type="email"
      />
      <TextInput
        autoComplete="new-password"
        defaultValue="password1234"
        label="Password"
        name="password"
        required
        type="password"
      />
      <Button className="mt-4 w-full" type="submit">
        Sign up
      </Button>
      <p className="min-h-6 text-sm text-muted">{status}</p>
    </form>
  );
}
