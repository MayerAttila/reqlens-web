"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import { DashboardSidebar } from "./dashboard-sidebar";

type DashboardShellProps = {
  children?: ReactNode;
  initialSidebarCollapsed?: boolean;
};

export function DashboardShell({
  children,
  initialSidebarCollapsed = true
}: DashboardShellProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, router, session]);

  if (isPending || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <p className="text-sm text-muted">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar initialCollapsed={initialSidebarCollapsed} />
      <section className="min-w-0 flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          {children ?? <DashboardOverview />}
        </div>
      </section>
    </main>
  );
}

function DashboardOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ["Projects", "0", "Create a project and generate API keys."],
        ["Requests", "0", "Ingested API calls will appear here."],
        ["Errors", "0", "Track failing backend routes."]
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
  );
}
