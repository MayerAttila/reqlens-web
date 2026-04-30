"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ActivityIcon,
  AlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  HomeIcon,
  KeyIcon,
  LogOutIcon,
  ShieldIcon,
  ZapIcon,
  type IconProps
} from "../icons";
import { toast } from "react-toastify";
import { authClient } from "../../lib/auth-client";

type SidebarIcon = (props: IconProps) => React.ReactNode;

const navItems = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/dashboard/projects", label: "Projects", icon: DatabaseIcon },
  { href: "/dashboard/api-keys", label: "API keys", icon: KeyIcon },
  { href: "/dashboard/requests", label: "Requests", icon: ActivityIcon },
  { href: "/dashboard/errors", label: "Errors", icon: AlertIcon }
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
          <ChevronRightIcon className="h-6 w-6" />
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
        <div className="flex items-center justify-between px-4 py-5">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={`flex min-w-0 items-center gap-3 overflow-hidden transition ${
              showLabels ? "opacity-100" : "opacity-0 md:w-0"
            }`}
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary-soft">
              <ShieldIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-[0.22em] text-muted">
                Reqlens
              </p>
              <h1 className="truncate text-base font-black text-foreground">
                Dashboard
              </h1>
            </div>
          </Link>

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
            className="hidden rounded-xl bg-surface p-2 text-muted transition hover:bg-surface-soft hover:text-foreground md:inline-flex"
          >
            {collapsed ? (
              <ChevronRightIcon className="h-6 w-6" />
            ) : (
              <ChevronLeftIcon className="h-6 w-6" />
            )}
          </button>

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl bg-surface p-2 text-muted transition hover:bg-surface-soft hover:text-foreground md:hidden"
          >
            <ChevronLeftIcon className="h-6 w-6" />
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
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted hover:bg-surface hover:text-foreground"
                } ${collapsed && !mobileOpen ? "justify-center" : ""}`}
              >
                <Icon className="h-6 w-6 shrink-0" />
                {showLabels ? (
                  <span className="whitespace-nowrap">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 px-3 py-4">
          <div className="rounded-2xl bg-surface p-3">
            <div className="flex items-start gap-3">
              <ZapIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-soft" />
              {showLabels ? (
                <p className="text-xs leading-relaxed text-muted">
                  Generate API keys, watch traffic, and catch backend failures.
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className={`flex w-full items-center gap-3 rounded-2xl bg-foreground px-3 py-3 text-sm font-black text-background transition hover:bg-primary-soft ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            <LogOutIcon className="h-6 w-6 shrink-0" />
            {showLabels ? <span className="whitespace-nowrap">Sign out</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}
