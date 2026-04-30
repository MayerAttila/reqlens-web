import { cookies } from "next/headers";
import { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";

const sidebarCookieName = "reqlens-sidebar-collapsed";

type DashboardPageProps = {
  children?: ReactNode;
};

export async function DashboardPage({
  children
}: DashboardPageProps) {
  const cookieStore = await cookies();
  const collapsed = cookieStore.get(sidebarCookieName)?.value !== "false";

  return (
    <DashboardShell initialSidebarCollapsed={collapsed}>
      {children}
    </DashboardShell>
  );
}
