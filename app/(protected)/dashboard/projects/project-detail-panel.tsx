"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { Button } from "../../../../components/ui/button";
import {
  DropdownSelect,
  DropdownSelectOption
} from "../../../../components/ui/dropdown-select";
import { MetricGrid } from "../../../../components/ui/metric-grid";
import {
  defaultLatencyErrorThresholdMs,
  isSlowRequest
} from "../../../../components/ui/request-badges";
import { TextInput } from "../../../../components/ui/text-input";
import { ToggleInput } from "../../../../components/ui/toggle-input";
import type {
  Project,
  EmailAlertAudience,
  ProjectInvite,
  ProjectMemberRole,
  ProjectUser,
  ProjectSettings,
  ProjectStats
} from "./projects-panel";

type ProjectDetailPanelProps = {
  projectId: string;
};

type RequestLog = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
};

type ProjectLogs = {
  projectId: string;
  logs: RequestLog[];
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";
const emptyProjectStats: ProjectStats = {
  errorCount: 0,
  health: "No traffic",
  lastRequestAt: null,
  lastStatus: null,
  requestCount: 0,
  slowCount: 0
};

export function ProjectDetailPanel({ projectId }: ProjectDetailPanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [customPicker, setCustomPicker] = useState<"error" | "latency" | null>(
    null
  );
  const [errorAudience, setErrorAudience] =
    useState<EmailAlertAudience>("admin_and_above");
  const [errorCustomUserIds, setErrorCustomUserIds] = useState<string[]>([]);
  const [latencyAudience, setLatencyAudience] =
    useState<EmailAlertAudience>("admin_and_above");
  const [latencyCustomUserIds, setLatencyCustomUserIds] = useState<string[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const [projectsResponse, logsResponse] = await Promise.all([
        fetch(`${apiUrl}/projects`, { credentials: "include" }),
        fetch(`${apiUrl}/logs`, { credentials: "include" })
      ]);

      if (!projectsResponse.ok || !logsResponse.ok) {
        throw new Error("Could not load project.");
      }

      const projectsData = (await projectsResponse.json()) as { projects: Project[] };
      const logsData = (await logsResponse.json()) as { projects: ProjectLogs[] };
      const foundProject =
        projectsData.projects.map(normalizeProject).find((item) => item.id === projectId) ??
        null;

      setProject(foundProject);
      setLatencyAudience(
        foundProject?.settings.latencyEmailAudience ?? "admin_and_above"
      );
      setLatencyCustomUserIds(foundProject?.settings.latencyEmailCustomUserIds ?? []);
      setErrorAudience(foundProject?.settings.errorEmailAudience ?? "admin_and_above");
      setErrorCustomUserIds(foundProject?.settings.errorEmailCustomUserIds ?? []);
      setLogs(
        logsData.projects.find((item) => item.projectId === projectId)?.logs ?? []
      );
    } catch {
      toast.error("Could not load project.");
    } finally {
      setIsLoading(false);
    }
  }

  const latencyThresholdForStats =
    project?.settings.latencyErrorThresholdMs ?? defaultLatencyErrorThresholdMs;
  const stats = useMemo(
    () => getProjectStats(logs, latencyThresholdForStats),
    [latencyThresholdForStats, logs]
  );

  async function copyApiKey() {
    if (!project) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/projects/${project.id}/api-key`, {
        credentials: "include"
      });
      const data = (await response.json()) as {
        apiKey?: string;
        error?: string;
      };

      if (!response.ok || !data.apiKey) {
        toast.error(data.error ?? "Could not copy API key.");
        return;
      }

      await navigator.clipboard.writeText(data.apiKey);
      toast.success("API key copied.");
    } catch {
      toast.error("Could not reach the API server.");
    }
  }

  async function inviteProjectMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email"));
    const toastId = toast.loading("Sending invite...");

    try {
      const response = await fetch(`${apiUrl}/projects/${project.id}/invites`, {
        body: JSON.stringify({ email }),
        credentials: "include",
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        invite?: ProjectInvite;
      };

      if (!response.ok || !data.invite) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not send invite.",
          type: "error"
        });
        return;
      }

      setProject((current) =>
        current ? { ...current, invites: [data.invite!, ...current.invites] } : current
      );
      form.reset();
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Invite sent.",
        type: "success"
      });
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the API server.",
        type: "error"
      });
    }
  }

  async function updateProjectDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name"));
    const description = String(formData.get("description"));
    const toastId = toast.loading("Saving project...");

    try {
      const response = await fetch(`${apiUrl}/projects/${project.id}`, {
        body: JSON.stringify({ description, name }),
        credentials: "include",
        headers: { "content-type": "application/json" },
        method: "PATCH"
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        project?: Partial<Project>;
      };

      if (!response.ok || !data.project) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not save project.",
          type: "error"
        });
        return;
      }

      setProject((current) =>
        current
          ? {
              ...current,
              description: data.project?.description ?? null,
              name: data.project?.name ?? current.name
            }
          : current
      );
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Project saved.",
        type: "success"
      });
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the API server.",
        type: "error"
      });
    }
  }

  async function updateProjectSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const errorEmailEnabled = formData.get("errorEmailEnabled") === "on";
    const errorEmailAudience = errorAudience;
    const errorEmailCustomUserIds = formData
      .getAll("errorEmailCustomUserIds")
      .map(String);
    const latencyEmailEnabled = formData.get("latencyEmailEnabled") === "on";
    const latencyEmailAudience = latencyAudience;
    const latencyEmailCustomUserIds = formData
      .getAll("latencyEmailCustomUserIds")
      .map(String);
    const latencyErrorThresholdMs = Number(formData.get("latencyErrorThresholdMs"));
    const toastId = toast.loading("Saving settings...");

    try {
      const response = await fetch(`${apiUrl}/projects/${project.id}/settings`, {
        body: JSON.stringify({
          errorEmailAudience,
          errorEmailCustomUserIds,
          errorEmailEnabled,
          errorEmailRecipient: null,
          latencyEmailAudience,
          latencyEmailCustomUserIds,
          latencyEmailEnabled,
          latencyEmailRecipient: null,
          latencyErrorThresholdMs
        }),
        credentials: "include",
        headers: { "content-type": "application/json" },
        method: "PATCH"
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        settings?: ProjectSettings;
      };

      if (!response.ok || !data.settings) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not save settings.",
          type: "error"
        });
        return;
      }

      setProject((current) =>
        current ? { ...current, settings: data.settings! } : current
      );
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Settings saved.",
        type: "success"
      });
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the API server.",
        type: "error"
      });
    }
  }

  async function removeProjectMember(memberId: string) {
    if (!project) {
      return;
    }

    const toastId = toast.loading("Removing member...");

    try {
      const response = await fetch(
        `${apiUrl}/projects/${project.id}/members/${memberId}`,
        { credentials: "include", method: "DELETE" }
      );
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not remove member.",
          type: "error"
        });
        return;
      }

      setProject((current) =>
        current
          ? {
              ...current,
              members: current.members.filter((member) => member.id !== memberId)
            }
          : current
      );
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Member removed.",
        type: "success"
      });
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the API server.",
        type: "error"
      });
    }
  }

  async function updateProjectMemberRole(
    memberId: string,
    role: ProjectMemberRole
  ) {
    if (!project) {
      return;
    }

    const toastId = toast.loading("Updating role...");

    try {
      const response = await fetch(
        `${apiUrl}/projects/${project.id}/members/${memberId}`,
        {
          body: JSON.stringify({ role }),
          credentials: "include",
          headers: { "content-type": "application/json" },
          method: "PATCH"
        }
      );
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not update role.",
          type: "error"
        });
        return;
      }

      setProject((current) =>
        current
          ? {
              ...current,
              members: current.members.map((member) =>
                member.id === memberId ? { ...member, role } : member
              )
            }
          : current
      );
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Role updated.",
        type: "success"
      });
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the API server.",
        type: "error"
      });
    }
  }

  async function revokeProjectInvite(inviteId: string) {
    if (!project) {
      return;
    }

    const toastId = toast.loading("Revoking invite...");

    try {
      const response = await fetch(
        `${apiUrl}/projects/${project.id}/invites/${inviteId}`,
        { credentials: "include", method: "DELETE" }
      );
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not revoke invite.",
          type: "error"
        });
        return;
      }

      setProject((current) =>
        current
          ? {
              ...current,
              invites: current.invites.filter((invite) => invite.id !== inviteId)
            }
          : current
      );
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Invite revoked.",
        type: "success"
      });
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the API server.",
        type: "error"
      });
    }
  }

  async function deleteProject() {
    if (!project) {
      return;
    }

    const toastId = toast.loading("Deleting project...");

    try {
      const response = await fetch(`${apiUrl}/projects/${project.id}`, {
        credentials: "include",
        method: "DELETE"
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not delete project.",
          type: "error"
        });
        return;
      }

      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Project deleted.",
        type: "success"
      });
      router.push("/dashboard/projects");
    } catch {
      toast.update(toastId, {
        autoClose: 4200,
        isLoading: false,
        render: "Could not reach the API server.",
        type: "error"
      });
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading project...</p>;
  }

  if (!project) {
    return (
      <div className="rounded-3xl bg-panel p-6">
        <h1 className="text-2xl font-black">Project not found</h1>
        <Link
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-2xl bg-surface px-4 py-2 text-sm font-black text-foreground transition hover:bg-surface-soft"
          href="/dashboard/projects"
        >
          <FiArrowLeft className="size-4" />
          Back to projects
        </Link>
      </div>
    );
  }

  const latencyThresholdMs = project.settings.latencyErrorThresholdMs;
  const canCopyApiKey =
    project.accessRole === "owner" ||
    project.accessRole === "admin" ||
    project.accessRole === "developer";
  const canManageProject =
    project.accessRole === "owner" || project.accessRole === "admin";

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl bg-panel p-6">
        <Link
          className="inline-flex w-fit items-center gap-2 rounded-2xl bg-surface px-4 py-2 text-sm font-black text-foreground transition hover:bg-surface-soft"
          href="/dashboard/projects"
        >
          <FiArrowLeft className="size-4" />
          Back to projects
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-primary">
              Project
            </p>
            <h1 className="mt-2 text-4xl font-black">{project.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {project.description || "No description yet."}
            </p>
          </div>
          {canCopyApiKey && project.hasApiKey ? (
            <Button onClick={copyApiKey} type="button">
              Copy API key
            </Button>
          ) : null}
        </div>
      </section>

      <MetricGrid
        blocks={[
          { label: "Requests", value: stats.requestCount },
          {
            helperText: `${latencyThresholdMs} ms or higher`,
            label: "Latency alerts",
            value: stats.slowCount
          },
          { label: "Errors", tone: "danger", value: stats.errorCount },
          { label: "Collaborators", value: project.members.length }
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="grid gap-4">
          <div className="rounded-3xl bg-panel p-6">
            <h2 className="text-2xl font-black">Project details</h2>
            <p className="mt-2 text-sm text-muted">
              Edit the name and short description shown across the dashboard.
            </p>

            {canManageProject ? (
              <form
                className="mt-6 grid gap-4"
                key={project.id}
                onSubmit={updateProjectDetails}
              >
                <TextInput
                  defaultValue={project.name}
                  name="name"
                  placeholder="Project name"
                  required
                />
                <label className="grid gap-2">
                  <span className="sr-only">Description</span>
                  <textarea
                    className="min-h-28 resize-none rounded-2xl border border-line bg-panel-strong px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary"
                    defaultValue={project.description ?? ""}
                    maxLength={240}
                    name="description"
                    placeholder="Short project description"
                  />
                </label>
                <Button type="submit">Save details</Button>
              </form>
            ) : (
              <p className="mt-6 rounded-2xl bg-panel-strong p-4 text-sm text-muted">
                Shared with you. Only owners and admins can edit project details.
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-panel p-6">
            <h2 className="text-2xl font-black">Alert settings</h2>
            <p className="mt-2 text-sm text-muted">
              Configure project-level thresholds and email summaries for
              problematic API calls.
            </p>

            {canManageProject ? (
              <form
                className="mt-6 grid gap-5"
                key={`${project.id}-${project.settings.latencyErrorThresholdMs}`}
                onSubmit={updateProjectSettings}
              >
                <div className="rounded-3xl bg-panel-strong p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Latency alert limit
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Calls at or above this value are treated as latency alerts.
                      </p>
                    </div>
                    <label className="flex w-full max-w-44 items-center gap-3 rounded-2xl bg-background/45 px-4 py-3">
                      <input
                        className="min-w-0 flex-1 bg-transparent text-2xl font-black text-foreground outline-none"
                        defaultValue={project.settings.latencyErrorThresholdMs}
                        max={60000}
                        min={1}
                        name="latencyErrorThresholdMs"
                        required
                        type="number"
                      />
                      <span className="text-sm font-black text-muted">ms</span>
                    </label>
                  </div>
                </div>

                <NotificationSetting
                  audienceName="latencyEmailAudience"
                  checkboxName="latencyEmailEnabled"
                  customUserIds={latencyCustomUserIds}
                  customUserIdsName="latencyEmailCustomUserIds"
                  defaultChecked={project.settings.latencyEmailEnabled}
                  eyebrow="Latency emails"
                  onAudienceChange={setLatencyAudience}
                  onCustomize={() => setCustomPicker("latency")}
                  recipientCount={getAlertRecipientCount({
                    audience: latencyAudience,
                    customUserIds: latencyCustomUserIds,
                    users: getProjectUsers(project)
                  })}
                  selectedAudience={latencyAudience}
                  title="Email latency alerts"
                >
                  Send one summary email when an ingest batch includes calls over
                  this project latency limit.
                </NotificationSetting>

                <NotificationSetting
                  audienceName="errorEmailAudience"
                  checkboxName="errorEmailEnabled"
                  customUserIds={errorCustomUserIds}
                  customUserIdsName="errorEmailCustomUserIds"
                  defaultChecked={project.settings.errorEmailEnabled}
                  eyebrow="Error emails"
                  onAudienceChange={setErrorAudience}
                  onCustomize={() => setCustomPicker("error")}
                  recipientCount={getAlertRecipientCount({
                    audience: errorAudience,
                    customUserIds: errorCustomUserIds,
                    users: getProjectUsers(project)
                  })}
                  selectedAudience={errorAudience}
                  title="Email errored API calls"
                >
                  Send one summary email when an ingest batch includes calls with
                  status 400 or higher.
                </NotificationSetting>

                <Button type="submit">Save alert settings</Button>
              </form>
            ) : (
              <p className="mt-6 rounded-2xl bg-panel-strong p-4 text-sm text-muted">
                Current limit: {project.settings.latencyErrorThresholdMs} ms.
                Latency emails are{" "}
                {project.settings.latencyEmailEnabled ? "enabled" : "disabled"}.
                Error emails are{" "}
                {project.settings.errorEmailEnabled ? "enabled" : "disabled"}.
              </p>
            )}
          </div>

          {canManageProject ? (
            <div className="rounded-3xl bg-panel p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black">Danger zone</h2>
                  <p className="mt-1 text-sm text-muted">
                    Permanently remove this project and its logs.
                  </p>
                </div>
                <button
                  className="rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/25"
                  onClick={() => void deleteProject()}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {customPicker ? (
          <CustomAlertUsersModal
            onClose={() => setCustomPicker(null)}
            onSave={(selectedIds) => {
              if (customPicker === "latency") {
                setLatencyAudience("custom");
                setLatencyCustomUserIds(selectedIds);
              } else {
                setErrorAudience("custom");
                setErrorCustomUserIds(selectedIds);
              }

              setCustomPicker(null);
            }}
            selectedUserIds={
              customPicker === "latency" ? latencyCustomUserIds : errorCustomUserIds
            }
            suggestedUserIds={getSuggestedRecipientIds({
              audience: customPicker === "latency" ? latencyAudience : errorAudience,
              customUserIds:
                customPicker === "latency"
                  ? latencyCustomUserIds
                  : errorCustomUserIds,
              users: getProjectUsers(project)
            })}
            title={
              customPicker === "latency"
                ? "Latency alert recipients"
                : "Error alert recipients"
            }
            users={getProjectUsers(project)}
          />
        ) : null}

        <aside className="rounded-3xl bg-panel p-6">
          <h2 className="text-2xl font-black">Members</h2>
          <p className="mt-1 text-sm text-muted">
            Manage collaborators and pending invites.
          </p>

          {canManageProject ? (
            <form className="mt-6 grid gap-3" onSubmit={inviteProjectMember}>
              <TextInput
                autoComplete="email"
                name="email"
                placeholder="teammate@example.com"
                required
                type="email"
              />
              <Button type="submit">Send invite</Button>
            </form>
          ) : null}

          <div className="mt-6 grid gap-5">
            <PeopleList
              actionLabel="Remove"
              emptyText="No accepted members yet."
              label="Members"
              onAction={removeProjectMember}
              people={project.members.map((member) => ({
                email: member.email,
                id: member.id,
                label: member.name,
                role: member.role
              }))}
              onRoleChange={updateProjectMemberRole}
              showActions={canManageProject}
            />
            <PeopleList
              actionLabel="Revoke"
              emptyText="No pending invites."
              label="Pending invites"
              onAction={revokeProjectInvite}
              people={project.invites.map((invite) => ({
                email: invite.email,
                id: invite.id,
                label: invite.email
              }))}
              showActions={canManageProject}
            />
          </div>
        </aside>
      </section>
    </div>
  );
}

function PeopleList({
  actionLabel,
  emptyText,
  label,
  onAction,
  onRoleChange,
  people,
  showActions
}: {
  actionLabel: string;
  emptyText: string;
  label: string;
  onAction: (id: string) => void;
  onRoleChange?: (id: string, role: ProjectMemberRole) => void;
  people: Array<{
    email?: string;
    id: string;
    label: string;
    role?: ProjectMemberRole;
  }>;
  showActions: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      {people.length ? (
        <div className="mt-3 grid gap-2">
          {people.map((person) => (
            <div
              className="grid gap-3 rounded-2xl bg-panel-strong px-4 py-3 text-sm"
              key={person.id}
            >
              <div className="min-w-0">
                <p className="truncate font-black text-foreground">{person.label}</p>
                {person.email && person.email !== person.label ? (
                  <p className="mt-1 truncate text-xs text-muted">{person.email}</p>
                ) : null}
              </div>
              {showActions ? (
                <div className="flex min-w-0 items-center justify-between gap-2">
                  {person.role && onRoleChange ? (
                    <div className="min-w-36">
                      <DropdownSelect
                        onChange={(role) => onRoleChange(person.id, role)}
                        options={memberRoleOptions}
                        value={person.role}
                      />
                    </div>
                  ) : null}
                  <button
                    aria-label={actionLabel}
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-muted transition hover:bg-red-500/15 hover:text-red-200"
                    onClick={() => onAction(person.id)}
                    title={actionLabel}
                    type="button"
                  >
                    <FiTrash2 className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-2xl bg-panel-strong p-4 text-sm text-muted">
          {emptyText}
        </p>
      )}
    </div>
  );
}

function NotificationSetting({
  audienceName,
  checkboxName,
  children,
  customUserIds,
  customUserIdsName,
  defaultChecked,
  eyebrow,
  onAudienceChange,
  onCustomize,
  recipientCount,
  selectedAudience,
  title
}: {
  audienceName: string;
  checkboxName: string;
  children: ReactNode;
  customUserIds: string[];
  customUserIdsName: string;
  defaultChecked: boolean;
  eyebrow: string;
  onAudienceChange: (audience: EmailAlertAudience) => void;
  onCustomize: () => void;
  recipientCount: number;
  selectedAudience: EmailAlertAudience;
  title: string;
}) {
  return (
    <div className="rounded-3xl bg-panel-strong p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-lg font-black">{title}</h3>
          <p className="mt-1 text-sm text-muted">{children}</p>
        </div>
        <ToggleInput
          defaultChecked={defaultChecked}
          name={checkboxName}
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <CustomAudienceSelect
          inputName={audienceName}
          onChange={onAudienceChange}
          value={selectedAudience}
        />
        <button
          className="rounded-2xl bg-surface px-4 py-3 text-sm font-black text-foreground transition hover:bg-surface-soft"
          onClick={onCustomize}
          type="button"
        >
          Choose users ({recipientCount})
        </button>
      </div>
      {customUserIds.map((userId) => (
        <input
          key={userId}
          name={customUserIdsName}
          type="hidden"
          value={userId}
        />
      ))}
    </div>
  );
}

const emailAudienceOptions: Array<DropdownSelectOption<EmailAlertAudience>> = [
  { label: "All users", value: "all" },
  { label: "Admin and above", value: "admin_and_above" },
  { label: "Developer and above", value: "developer_and_above" },
  { label: "Custom users", value: "custom" }
];

const memberRoleOptions: Array<DropdownSelectOption<ProjectMemberRole>> = [
  { label: "Admin", value: "admin" },
  { label: "Developer", value: "developer" },
  { label: "Viewer", value: "viewer" }
];

function CustomAlertUsersModal({
  onClose,
  onSave,
  selectedUserIds,
  suggestedUserIds,
  title,
  users
}: {
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
  selectedUserIds: string[];
  suggestedUserIds: string[];
  title: string;
  users: Array<ProjectUser & { role: Project["accessRole"] }>;
}) {
  const [draftUserIds, setDraftUserIds] = useState(
    selectedUserIds.length ? selectedUserIds : suggestedUserIds
  );

  function toggleUser(userId: string) {
    setDraftUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-panel p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              Custom recipients
            </p>
            <h2 className="mt-2 text-2xl font-black">{title}</h2>
            <p className="mt-1 text-sm text-muted">
              Select which project users should receive this alert email.
            </p>
          </div>
          <button
            className="rounded-2xl bg-surface px-3 py-2 text-sm font-black text-muted transition hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid max-h-80 gap-2 overflow-y-auto">
          {users.map((user) => (
            <label
              className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-panel-strong px-4 py-3 transition hover:bg-surface"
              key={user.id}
            >
              <input
                checked={draftUserIds.includes(user.id)}
                className="peer sr-only"
                onChange={() => toggleUser(user.id)}
                type="checkbox"
              />
              <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-line bg-background text-transparent transition peer-checked:border-primary/50 peer-checked:bg-primary peer-checked:text-white">
                <span className="text-sm font-black leading-none">✓</span>
              </span>
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-foreground">
                    {user.name}
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {user.email}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary-soft">
                  {roleLabel(user.role)}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button onClick={() => onSave(draftUserIds)} type="button">
            Save recipients
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomAudienceSelect({
  inputName,
  onChange,
  value
}: {
  inputName: string;
  onChange: (value: EmailAlertAudience) => void;
  value: EmailAlertAudience;
}) {
  return (
    <DropdownSelect
      inputName={inputName}
      onChange={onChange}
      options={emailAudienceOptions}
      value={value}
    />
  );
}

function getProjectStats(logs: RequestLog[], latencyThresholdMs: number): ProjectStats {
  const sortedLogs = [...logs].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
  const latestLog = sortedLogs[0];
  const errorCount = logs.filter((log) => log.statusCode >= 400).length;
  const slowCount = logs.filter((log) =>
    isSlowRequest(log.durationMs, latencyThresholdMs)
  ).length;

  return {
    errorCount,
    health:
      logs.length === 0
        ? "No traffic"
        : errorCount > 0
          ? "Has errors"
          : slowCount > 0
            ? "Watch"
            : "Healthy",
    lastRequestAt: latestLog?.createdAt ?? null,
    lastStatus: latestLog?.statusCode ?? null,
    requestCount: logs.length,
    slowCount
  };
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    accessRole: normalizeAccessRole(project.accessRole),
    invites: project.invites ?? [],
    members: (project.members ?? []).map((member) => ({
      ...member,
      role: member.role ?? "viewer"
    })),
    settings: normalizeProjectSettings(project.settings)
  };
}

function normalizeAccessRole(role: Project["accessRole"] | string | undefined) {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "developer" ||
    role === "viewer"
  ) {
    return role;
  }

  return "viewer";
}

function normalizeProjectSettings(settings: Project["settings"] | undefined) {
  return {
    errorEmailAudience: normalizeEmailAlertAudience(settings?.errorEmailAudience),
    errorEmailCustomUserIds: settings?.errorEmailCustomUserIds ?? [],
    errorEmailEnabled: settings?.errorEmailEnabled ?? false,
    errorEmailRecipient: settings?.errorEmailRecipient ?? null,
    latencyEmailAudience: normalizeEmailAlertAudience(settings?.latencyEmailAudience),
    latencyEmailCustomUserIds: settings?.latencyEmailCustomUserIds ?? [],
    latencyEmailEnabled: settings?.latencyEmailEnabled ?? false,
    latencyEmailRecipient: settings?.latencyEmailRecipient ?? null,
    latencyErrorThresholdMs:
      settings?.latencyErrorThresholdMs ?? defaultLatencyErrorThresholdMs
  };
}

function normalizeEmailAlertAudience(
  audience: Project["settings"]["latencyEmailAudience"] | string | undefined
): EmailAlertAudience {
  if (
    audience === "all" ||
    audience === "admin_and_above" ||
    audience === "developer_and_above" ||
    audience === "custom"
  ) {
    return audience;
  }

  return "admin_and_above";
}

function getProjectUsers(project: Project) {
  const users = [
    ...(project.owner
      ? [{ ...project.owner, role: "owner" as const }]
      : []),
    ...project.members.map((member) => ({
      email: member.email,
      id: member.id,
      name: member.name,
      role: member.role
    }))
  ];

  return users.filter(
    (user, index, current) =>
      current.findIndex((item) => item.id === user.id) === index
  );
}

function roleLabel(role: Project["accessRole"]) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "developer":
      return "Developer";
    default:
      return "Viewer";
  }
}

function getAlertRecipientCount({
  audience,
  customUserIds,
  users
}: {
  audience: EmailAlertAudience;
  customUserIds: string[];
  users: Array<ProjectUser & { role: Project["accessRole"] }>;
}) {
  return getSuggestedRecipientIds({ audience, customUserIds, users }).length;
}

function getSuggestedRecipientIds({
  audience,
  customUserIds,
  users
}: {
  audience: EmailAlertAudience;
  customUserIds: string[];
  users: Array<ProjectUser & { role: Project["accessRole"] }>;
}) {
  if (audience === "custom") {
    return customUserIds;
  }

  if (audience === "all") {
    return users.map((user) => user.id);
  }

  if (audience === "developer_and_above") {
    return users
      .filter(
        (user) =>
          user.role === "owner" ||
          user.role === "admin" ||
          user.role === "developer"
      )
      .map((user) => user.id);
  }

  return users
    .filter((user) => user.role === "owner" || user.role === "admin")
    .map((user) => user.id);
}
