"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const toastId = toast.loading("Sending reset email...");

    setPending(true);

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (result.error) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: result.error.message ?? "Could not send reset email.",
          type: "error"
        });
        return;
      }

      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "If this email exists, a reset link was sent.",
        type: "success"
      });
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the auth server.",
        type: "error"
      });
    } finally {
      setPending(false);
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
      <Button className="mt-4 w-full" disabled={pending} type="submit">
        {pending ? "Sending..." : "Send reset email"}
      </Button>
    </form>
  );
}
