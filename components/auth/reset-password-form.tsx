"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (!token) {
      const message = "Reset token is missing. Request a new reset email.";
      setFormError(message);
      toast.error(message);
      return;
    }

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
    setPending(true);
    const toastId = toast.loading("Resetting password...");

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token
      });

      if (result.error) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: result.error.message ?? "Could not reset password.",
          type: "error"
        });
        return;
      }

      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Password reset. You can log in now.",
        type: "success"
      });
      router.push("/login");
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
        autoComplete="new-password"
        minLength={8}
        name="password"
        placeholder="New password"
        required
        type="password"
      />
      <TextInput
        aria-invalid={formError ? "true" : "false"}
        autoComplete="new-password"
        minLength={8}
        name="confirmPassword"
        placeholder="Confirm new password"
        required
        type="password"
      />
      {formError ? <p className="-mt-3 text-sm text-red-300">{formError}</p> : null}
      <Button className="mt-4 w-full" disabled={pending || !token} type="submit">
        {pending ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
