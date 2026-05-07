"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { authClient } from "../../lib/auth-client";
import { ButtonLink } from "../ui/button";

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";

export function AcceptInvitePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { data: session, isPending } = authClient.useSession();
  const [accepted, setAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (isPending || !session || !token || accepted || isAccepting) {
      return;
    }

    void acceptInvite();
  }, [accepted, isAccepting, isPending, session, token]);

  async function acceptInvite() {
    setIsAccepting(true);
    const toastId = toast.loading("Accepting invite...");

    try {
      const response = await fetch(`${apiUrl}/projects/invites/accept`, {
        body: JSON.stringify({ token }),
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        projectName?: string;
      };

      if (!response.ok) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not accept invite.",
          type: "error"
        });
        return;
      }

      setAccepted(true);
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: `Invite accepted${data.projectName ? `: ${data.projectName}` : ""}.`,
        type: "success"
      });
      router.push("/dashboard/projects");
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the API server.",
        type: "error"
      });
    } finally {
      setIsAccepting(false);
    }
  }

  if (!token) {
    return <p className="text-sm text-red-300">Invite token is missing.</p>;
  }

  if (isPending) {
    return <p className="text-sm text-muted">Checking session...</p>;
  }

  if (!session) {
    const callbackUrl = `/accept-invite?token=${encodeURIComponent(token)}`;

    return (
      <div className="grid gap-4">
        <p className="text-sm text-muted">
          Log in with the invited email address to accept this project invite.
        </p>
        <ButtonLink
          className="w-full"
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Login to accept invite
        </ButtonLink>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted">
      {isAccepting ? "Accepting invite..." : "Invite accepted. Redirecting..."}
    </p>
  );
}
