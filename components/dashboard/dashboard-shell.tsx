"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import { DashboardOverview } from "./dashboard-overview";
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
      <section className="min-w-0 flex-1 px-5 py-8 md:px-8 xl:px-10">
        <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-10">
          {children ?? <DashboardOverview />}
        </div>
      </section>
    </main>
  );
}
