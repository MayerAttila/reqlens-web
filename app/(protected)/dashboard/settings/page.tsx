import { DashboardPage } from "../../../../components/dashboard/dashboard-page";
import { ChangePasswordForm } from "./change-password-form";

export default function SettingsPage() {
  return (
    <DashboardPage>
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-panel p-6">
            <h2 className="text-xl font-black">Account</h2>
            <p className="mt-2 text-sm text-muted">
              Update your password for the current account. Other active
              sessions will be revoked after a successful change.
            </p>
            <ChangePasswordForm />
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
