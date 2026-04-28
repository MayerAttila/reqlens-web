"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

export function SignupForm() {
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (password.length < 8) {
      const message = "Password must be at least 8 characters.";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      setFormError(message);
      toast.error(message);
      return;
    }

    setFormError("");
    const toastId = toast.loading("Creating account...");

    try {
      const result = await authClient.signUp.email({
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        password
      });

      if (result.error) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: getSignupErrorMessage(result.error.message),
          type: "error"
        });
        return;
      }

      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Account created.",
        type: "success"
      });
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the auth server.",
        type: "error"
      });
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <TextInput
        autoComplete="name"
        name="name"
        placeholder="Name"
        required
      />
      <TextInput
        autoComplete="email"
        name="email"
        placeholder="Email"
        required
        type="email"
      />
      <TextInput
        autoComplete="new-password"
        minLength={8}
        name="password"
        placeholder="Password"
        required
        type="password"
      />
      <TextInput
        aria-invalid={formError ? "true" : "false"}
        autoComplete="new-password"
        minLength={8}
        name="confirmPassword"
        placeholder="Confirm password"
        required
        type="password"
      />
      {formError ? (
        <p className="-mt-3 text-sm text-red-300">{formError}</p>
      ) : null}
      <Button className="mt-4 w-full" type="submit">
        Sign up
      </Button>
    </form>
  );
}

function getSignupErrorMessage(message?: string): string {
  if (message?.toLowerCase().includes("already")) {
    return "This email is already registered. Try logging in instead.";
  }

  return message ?? "Could not create account.";
}
