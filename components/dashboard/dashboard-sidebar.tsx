"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiDatabase,
  FiHome,
  FiLogOut,
  FiSettings
} from "react-icons/fi";
import { IconType } from "react-icons";
import { toast } from "react-toastify";
import { authClient } from "../../lib/auth-client";

type SidebarIcon = IconType;

const navItems = [
  { href: "/dashboard", label: "Overview", icon: FiHome },
  { href: "/dashboard/projects", label: "Projects", icon: FiDatabase },
  { href: "/dashboard/requests", label: "Requests", icon: FiActivity },
  { href: "/dashboard/errors", label: "Problems", icon: FiAlertTriangle },
  { href: "/dashboard/statistics", label: "Statistics", icon: FiBarChart2 }
] satisfies Array<{
  href: string;
  label: string;
  icon: SidebarIcon;
}>;

const sidebarCookieName = "reqlens-sidebar-collapsed";

type DashboardSidebarProps = {
  initialCollapsed?: boolean;
};

export function DashboardSidebar({
  initialCollapsed = true
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activePath = useMemo(() => pathname ?? "/dashboard", [pathname]);
  const showLabels = !collapsed || mobileOpen;

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      document.cookie = `${sidebarCookieName}=${String(next)}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }

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

  return (
    <>
      {!mobileOpen ? (
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-[60] rounded-xl bg-panel p-2 text-foreground shadow-xl shadow-black/30 md:hidden"
        >
          <FiChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col overflow-hidden bg-panel-strong shadow-2xl shadow-black/40 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-20" : "md:w-72"}`}
      >
        <div
          className={`grid items-center gap-3 px-4 py-5 ${
            showLabels ? "grid-cols-[44px_1fr_40px]" : "grid-cols-1"
          }`}
        >
          {showLabels ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Image
                  src="/images/logo.png"
                  alt="Reqlens"
                  width={44}
                  height={44}
                  priority
                  className="h-11 w-11 shrink-0 rounded-2xl object-cover"
                />
              </Link>

              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="min-w-0 text-center"
              >
                <p className="truncate text-xs uppercase tracking-[0.22em] text-muted">
                  Reqlens
                </p>
                <h1 className="truncate text-base font-black text-foreground">
                  Dashboard
                </h1>
              </Link>
            </>
          ) : null}

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
            className="hidden h-11 w-11 items-center justify-center justify-self-center rounded-xl bg-surface p-0 text-muted transition hover:bg-surface-soft hover:text-foreground md:inline-flex"
          >
            {collapsed ? (
              <FiChevronRight className="h-5 w-5" />
            ) : (
              <FiChevronLeft className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl bg-surface p-2 text-muted transition hover:bg-surface-soft hover:text-foreground md:hidden"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              activePath === item.href ||
              (item.href !== "/dashboard" && activePath.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted hover:bg-surface hover:text-foreground"
                } ${
                  collapsed && !mobileOpen
                    ? "mx-auto h-11 w-11 justify-center rounded-xl p-0"
                    : "rounded-2xl"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {showLabels ? (
                  <span className="whitespace-nowrap">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 px-3 py-4">
          <Link
            href="/dashboard/settings"
            title="Settings"
            aria-label="Settings"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-3 text-sm font-semibold transition ${
              activePath === "/dashboard/settings"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-surface text-muted hover:bg-surface-soft hover:text-foreground"
            } ${
              collapsed && !mobileOpen
                ? "mx-auto h-11 w-11 justify-center rounded-xl p-0"
                : "rounded-2xl"
            }`}
          >
            <FiSettings className="h-5 w-5 shrink-0" />
            {showLabels ? <span className="whitespace-nowrap">Settings</span> : null}
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className={`flex items-center gap-3 bg-foreground px-3 py-3 text-sm font-black text-background transition hover:bg-primary-soft ${
              collapsed && !mobileOpen
                ? "mx-auto h-11 w-11 justify-center rounded-xl p-0"
                : "w-full rounded-2xl"
            }`}
          >
            <FiLogOut className="h-5 w-5 shrink-0" />
            {showLabels ? <span className="whitespace-nowrap">Sign out</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}
