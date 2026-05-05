import { DashboardPage } from "../../../../components/dashboard/dashboard-page";

export default function SettingsPage() {
  return (
    <DashboardPage>
      <div className="grid gap-6">
        <section className="rounded-3xl bg-panel p-6 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.22em] text-primary">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-black">Workspace settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Manage dashboard preferences and project-level defaults. More
            settings will land here as Reqlens grows.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-panel p-6">
            <h2 className="text-xl font-black">Account</h2>
            <p className="mt-2 text-sm text-muted">
              Authentication is handled by Better Auth. Profile controls can be
              added here next.
            </p>
          </article>

          <article className="rounded-3xl bg-panel p-6">
            <h2 className="text-xl font-black">Data</h2>
            <p className="mt-2 text-sm text-muted">
              Request logs are stored by project API key. Retention and export
              options can live here later.
            </p>
          </article>
        </section>
      </div>
    </DashboardPage>
  );
}
