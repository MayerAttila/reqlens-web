"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { authClient } from "../../../../lib/auth-client";
import { Button } from "../../../../components/ui/button";
import { TextInput } from "../../../../components/ui/text-input";

export function ChangePasswordForm() {
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword"));
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (newPassword.length < 8) {
      const message = "New password must be at least 8 characters.";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (newPassword !== confirmPassword) {
      const message = "New passwords do not match.";
      setFormError(message);
      toast.error(message);
      return;
    }

    setFormError("");
    setPending(true);
    const toastId = toast.loading("Changing password...");

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true
      });

      if (result.error) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: getPasswordErrorMessage(result.error.message),
          type: "error"
        });
        return;
      }

      form.reset();
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Password changed.",
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
    <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
      <TextInput
        autoComplete="current-password"
        name="currentPassword"
        placeholder="Current password"
        required
        type="password"
      />
      <TextInput
        autoComplete="new-password"
        minLength={8}
        name="newPassword"
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
      {formError ? <p className="-mt-2 text-sm text-red-300">{formError}</p> : null}
      <div className="flex justify-end">
        <Button disabled={pending} type="submit">
          {pending ? "Changing..." : "Change password"}
        </Button>
      </div>
    </form>
  );
}

function getPasswordErrorMessage(message?: string): string {
  if (message?.toLowerCase().includes("invalid")) {
    return "Current password is incorrect.";
  }

  return message ?? "Could not change password.";
}
