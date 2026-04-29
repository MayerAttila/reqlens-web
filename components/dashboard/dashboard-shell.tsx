"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";

export function DashboardShell() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, router, session]);

  async function handleSignOut() {
    const toastId = toast.loading("Signing out...");

    try {
      const result = await authClient.signOut();

      if (result.error) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: result.error.message ?? "Could not sign out.",
          type: "error"
        });
        return;
      }

      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Signed out.",
        type: "success"
      });
      router.replace("/login");
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the auth server.",
        type: "error"
      });
    }
  }

  if (isPending || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <p className="text-sm text-muted">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-5 rounded-3xl border border-line bg-panel p-6 shadow-2xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-primary">
              Reqlens dashboard
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Welcome back{session.user.name ? `, ${session.user.name}` : ""}.
            </h1>
            <p className="mt-2 max-w-2xl text-muted">
              This is the base authenticated dashboard. Next we can add projects,
              API keys, and request analytics here.
            </p>
          </div>
          <Button onClick={handleSignOut} type="button" variant="secondary">
            Sign out
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Projects", "0", "Create a project and generate API keys."],
            ["Requests", "0", "Ingested API calls will appear here."],
            ["Errors", "0", "Track failing backend routes."],
          ].map(([label, value, copy]) => (
            <article
              className="rounded-2xl border border-line bg-panel-strong p-5"
              key={label}
            >
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-3 text-4xl font-black">{value}</p>
              <p className="mt-3 text-sm text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
