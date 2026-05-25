"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiClock,
  FiCode,
  FiCreditCard,
  FiEdit3,
  FiShield,
  FiUser
} from "react-icons/fi";
import { toast } from "react-toastify";
import { Button } from "../../../../components/ui/button";
import { CopyIconButton } from "../../../../components/ui/copy-icon-button";
import { DropdownSelect } from "../../../../components/ui/dropdown-select";
import { TextInput } from "../../../../components/ui/text-input";
import { ChangePasswordForm } from "./change-password-form";

type AlertAudience =
  | "admin_and_above"
  | "all"
  | "custom"
  | "developer_and_above";
type InviteRole = "admin" | "developer" | "viewer";
type DigestPeriod = "AM" | "PM";

type AccountSettings = {
  defaultErrorDigestEmailAudience: AlertAudience;
  defaultErrorDigestEmailTime: string;
  defaultErrorDigestEmailTimezone: string;
  defaultErrorEmailAudience: AlertAudience;
  defaultInviteRole: InviteRole;
  defaultLatencyEmailAudience: AlertAudience;
  defaultLatencyErrorThresholdMs: number;
};

type SettingsResponse = {
  settings: AccountSettings;
  user: {
    email: string;
    name: string;
  };
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";
const audienceOptions: Array<{ label: string; value: AlertAudience }> = [
  { label: "Admin and above", value: "admin_and_above" },
  { label: "Developer and above", value: "developer_and_above" },
  { label: "All project members", value: "all" },
  { label: "Custom per project", value: "custom" }
];
const inviteRoleOptions: Array<{ label: string; value: InviteRole }> = [
  { label: "Viewer", value: "viewer" },
  { label: "Developer", value: "developer" },
  { label: "Admin", value: "admin" }
];
const digestHours = Array.from({ length: 12 }, (_, index) => index + 1);
const digestMinutes = Array.from({ length: 60 }, (_, index) => index);
const digestPeriods: DigestPeriod[] = ["AM", "PM"];

const fallbackSettings: AccountSettings = {
  defaultErrorDigestEmailAudience: "admin_and_above",
  defaultErrorDigestEmailTime: "08:00",
  defaultErrorDigestEmailTimezone: getBrowserTimezone(),
  defaultErrorEmailAudience: "admin_and_above",
  defaultInviteRole: "viewer",
  defaultLatencyEmailAudience: "admin_and_above",
  defaultLatencyErrorThresholdMs: 750
};

export function SettingsPanel() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [name, setName] = useState("");
  const [settings, setSettings] = useState<AccountSettings>(fallbackSettings);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/settings`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load settings.");
      }

      const data = (await response.json()) as SettingsResponse;
      setEmail(data.user.email);
      setName(data.user.name);
      setSettings({
        ...data.settings,
        defaultErrorDigestEmailTimezone:
          data.settings.defaultErrorDigestEmailTimezone || getBrowserTimezone()
      });
    } catch {
      toast.error("Could not load settings.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }

    await saveAccountSettings({
      nextName: name.trim(),
      nextSettings: settings,
      setPending: setIsSavingProfile,
      successMessage: "Account saved.",
      toastMessage: "Saving account..."
    });
  }

  async function saveDefaults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await saveAccountSettings({
      nextName: name.trim(),
      nextSettings: settings,
      setPending: setIsSavingDefaults,
      successMessage: "Default alerts saved.",
      toastMessage: "Saving default alerts..."
    });
  }

  async function saveAccountSettings({
    nextName,
    nextSettings,
    setPending,
    successMessage,
    toastMessage
  }: {
    nextName: string;
    nextSettings: AccountSettings;
    setPending: (pending: boolean) => void;
    successMessage: string;
    toastMessage: string;
  }) {
    setPending(true);
    const toastId = toast.loading(toastMessage);

    try {
      const response = await fetch(`${apiUrl}/settings`, {
        body: JSON.stringify({
          ...nextSettings,
          defaultLatencyErrorThresholdMs: Number(
            nextSettings.defaultLatencyErrorThresholdMs
          ),
          name: nextName
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });
      const data = (await response.json()) as Partial<SettingsResponse> & {
        error?: string;
      };

      if (!response.ok || !data.settings || !data.user) {
        throw new Error(data.error ?? "Could not save settings.");
      }

      setEmail(data.user.email);
      setName(data.user.name);
      setSettings(data.settings);
      toast.update(toastId, {
        autoClose: 3000,
        isLoading: false,
        render: successMessage,
        type: "success"
      });
    } catch (error) {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: error instanceof Error ? error.message : "Could not save settings.",
        type: "error"
      });
    } finally {
      setPending(false);
    }
  }

  function updateSetting<TKey extends keyof AccountSettings>(
    key: TKey,
    value: AccountSettings[TKey]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl bg-panel p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-black text-foreground">
          Account settings
        </h1>
        <p className="mt-2 text-sm text-muted">
          Profile, workspace defaults, developer details, and account controls.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SettingsCard
          icon={<FiUser className="size-5" />}
          kicker="Profile"
          title="Account"
        >
          <form className="flex min-h-[17.25rem] flex-col gap-6" onSubmit={saveProfile}>
            <div className="grid gap-5">
              <TextInput
                disabled={isLoading}
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                value={name}
              />
              <TextInput
                disabled
                name="email"
                placeholder="Email"
                type="email"
                value={email}
              />
            </div>
            <div className="mt-auto flex justify-end">
              <Button disabled={isLoading || isSavingProfile} type="submit">
                {isSavingProfile ? "Saving..." : "Save account"}
              </Button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard
          icon={<FiShield className="size-5" />}
          kicker="Security"
          title="Password"
        >
          <ChangePasswordForm />
        </SettingsCard>
      </section>

      <form className="grid gap-6" onSubmit={saveDefaults}>
        <SettingsCard
          icon={<FiAlertTriangle className="size-5" />}
          kicker="Defaults"
          title="Default alert settings"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <TextInput
              disabled={isLoading}
              label="Latency threshold"
              min={1}
              name="defaultLatencyErrorThresholdMs"
              onChange={(event) =>
                updateSetting(
                  "defaultLatencyErrorThresholdMs",
                  Number(event.target.value)
                )
              }
              type="number"
              value={settings.defaultLatencyErrorThresholdMs}
            />
            <Field label="Daily digest time">
              <DigestTimePicker
                name="defaultErrorDigestEmailTime"
                onChange={(value) =>
                  updateSetting("defaultErrorDigestEmailTime", value)
                }
                value={settings.defaultErrorDigestEmailTime}
              />
            </Field>
            <Field label="Latency email audience">
              <DropdownSelect
                onChange={(value) =>
                  updateSetting("defaultLatencyEmailAudience", value)
                }
                options={audienceOptions}
                value={settings.defaultLatencyEmailAudience}
              />
            </Field>
            <Field label="Error email audience">
              <DropdownSelect
                onChange={(value) =>
                  updateSetting("defaultErrorEmailAudience", value)
                }
                options={audienceOptions}
                value={settings.defaultErrorEmailAudience}
              />
            </Field>
            <Field label="Digest audience">
              <DropdownSelect
                onChange={(value) =>
                  updateSetting("defaultErrorDigestEmailAudience", value)
                }
                options={audienceOptions}
                value={settings.defaultErrorDigestEmailAudience}
              />
            </Field>
            <Field label="Default invite role">
              <DropdownSelect
                onChange={(value) => updateSetting("defaultInviteRole", value)}
                options={inviteRoleOptions}
                value={settings.defaultInviteRole}
              />
            </Field>
          </div>
          <input
            name="defaultErrorDigestEmailTimezone"
            type="hidden"
            value={settings.defaultErrorDigestEmailTimezone}
          />
          <div className="mt-6 flex justify-end">
            <Button disabled={isLoading || isSavingDefaults} type="submit">
              {isSavingDefaults ? "Saving..." : "Save default alerts"}
            </Button>
          </div>
        </SettingsCard>
      </form>

      <section className="grid gap-6 xl:grid-cols-2">
        <SettingsCard
          icon={<FiCode className="size-5" />}
          kicker="Developer"
          title="Developer defaults"
        >
          <div className="grid gap-3">
            <CopyRow label="API base URL" value={apiUrl} />
            <CopyRow label="Ingest endpoint" value={`${apiUrl}/ingest`} />
            <div className="rounded-2xl bg-background/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">
                  Fetch example
                </p>
                <CopyIconButton
                  label="Copy fetch example"
                  onCopy={() => copyText(getFetchExample())}
                />
              </div>
              <pre className="mt-3 overflow-x-auto text-xs leading-6 text-muted">
                {getFetchExample()}
              </pre>
            </div>
          </div>
        </SettingsCard>

        <div className="grid gap-6">
          <SettingsCard
            icon={<FiCreditCard className="size-5" />}
            kicker="Billing"
            title="Plan"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Current plan" value="Local" />
              <InfoTile label="Usage" value="Unlimited" />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={<FiAlertTriangle className="size-5" />}
            kicker="Danger zone"
            title="Account removal"
          >
            <div className="flex flex-col gap-4 rounded-2xl bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-red-200">Delete account</p>
                <p className="mt-1 text-sm text-muted">
                  Account deletion will be added after data export is available.
                </p>
              </div>
              <Button disabled type="button" variant="secondary">
                Delete account
              </Button>
            </div>
          </SettingsCard>
        </div>
      </section>
    </div>
  );
}

function SettingsCard({
  children,
  icon,
  kicker,
  title
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) {
  return (
    <section className="rounded-3xl bg-panel p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary-soft">
          {icon}
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            {kicker}
          </p>
          <h2 className="mt-1 text-xl font-black text-foreground">{title}</h2>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

function DigestTimePicker({
  name,
  onChange,
  value
}: {
  name: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedValue = normalizeDigestTime(value);
  const time = parseDigestTime(normalizedValue);

  function updateHour(hour: number) {
    onChange(formatDigestTime(toHour24(hour, time.period), time.minute));
  }

  function updateMinute(minute: number) {
    onChange(formatDigestTime(time.hour24, minute));
  }

  function updatePeriod(period: DigestPeriod) {
    onChange(formatDigestTime(toHour24(time.hour, period), time.minute));
  }

  return (
    <div className="relative">
      <input name={name} type="hidden" value={normalizedValue} />
      <button
        aria-expanded={isOpen}
        aria-label="Default daily digest send time"
        className="group flex h-12 w-full items-center gap-2 border-b border-line text-left transition hover:border-primary/55 focus:border-primary focus:outline-none"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <FiEdit3 className="size-3.5 shrink-0 text-muted transition group-hover:text-primary group-focus:text-primary" />
        <span className="min-w-0 flex-1 whitespace-nowrap text-sm font-black text-foreground">
          {formatDigestTimeLabel(time)}
        </span>
        <FiClock className="size-3.5 shrink-0 text-muted transition group-hover:text-primary group-focus:text-primary" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[17rem] rounded-2xl border border-primary/35 bg-panel p-3 shadow-2xl shadow-black/35">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.25rem] gap-2">
            <DigestTimeColumn
              label="Hour"
              onSelect={updateHour}
              selected={time.hour}
              values={digestHours}
            />
            <DigestTimeColumn
              label="Minute"
              onSelect={updateMinute}
              selected={time.minute}
              values={digestMinutes}
            />
            <DigestPeriodColumn
              onSelect={updatePeriod}
              selected={time.period}
            />
          </div>
          <button
            className="mt-3 h-9 w-full rounded-xl bg-surface text-sm font-black text-foreground transition hover:bg-surface-soft"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DigestTimeColumn({
  label,
  onSelect,
  selected,
  values
}: {
  label: string;
  onSelect: (value: number) => void;
  selected: number;
  values: number[];
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <div className="time-picker-scroll grid max-h-48 gap-1 overflow-y-auto rounded-xl bg-background/45 p-1">
        {values.map((value) => (
          <button
            className={`h-8 rounded-lg text-sm font-black transition ${
              value === selected
                ? "bg-primary text-white"
                : "text-foreground hover:bg-surface"
            }`}
            key={value}
            onClick={() => onSelect(value)}
            type="button"
          >
            {String(value).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}

function DigestPeriodColumn({
  onSelect,
  selected
}: {
  onSelect: (period: DigestPeriod) => void;
  selected: DigestPeriod;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.16em] text-muted">
        Half
      </p>
      <div className="grid gap-1 rounded-xl bg-background/45 p-1">
        {digestPeriods.map((period) => (
          <button
            className={`h-8 rounded-lg text-sm font-black transition ${
              period === selected
                ? "bg-primary text-white"
                : "text-foreground hover:bg-surface"
            }`}
            key={period}
            onClick={() => onSelect(period)}
            type="button"
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-background/45 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-black text-foreground">{value}</p>
      </div>
      <CopyIconButton label={`Copy ${label}`} onCopy={() => copyText(value)} />
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/45 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
  toast.success("Copied.");
}

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function normalizeDigestTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "08:00";
}

function parseDigestTime(value: string) {
  const [hourValue, minuteValue] = normalizeDigestTime(value).split(":");
  const hour24 = Number(hourValue);
  const minute = Number(minuteValue);

  return {
    hour: hour24 % 12 || 12,
    hour24,
    minute,
    period: hour24 < 12 ? ("AM" as const) : ("PM" as const)
  };
}

function toHour24(hour: number, period: DigestPeriod) {
  const twelveHour = hour % 12;

  return period === "PM" ? twelveHour + 12 : twelveHour;
}

function formatDigestTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDigestTimeLabel(time: ReturnType<typeof parseDigestTime>) {
  return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(
    2,
    "0"
  )} ${time.period}`;
}

function getFetchExample() {
  return `fetch("${apiUrl}/ingest", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-reqlens-key": "PROJECT_API_KEY"
  },
  body: JSON.stringify({ logs: [] })
});`;
}
