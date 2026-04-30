import { cookies } from "next/headers";
import { DashboardShell } from "./dashboard-shell";

const sidebarCookieName = "reqlens-sidebar-collapsed";

export async function DashboardPage() {
  const cookieStore = await cookies();
  const collapsed = cookieStore.get(sidebarCookieName)?.value !== "false";

  return <DashboardShell initialSidebarCollapsed={collapsed} />;
}
