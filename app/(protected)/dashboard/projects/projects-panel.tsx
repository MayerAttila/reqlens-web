"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "../../../../components/ui/button";
import { MetricGrid } from "../../../../components/ui/metric-grid";
import {
  defaultLatencyErrorThresholdMs,
  isSlowRequest,
} from "../../../../components/ui/request-badges";
import { CreateProjectModal } from "./create-project-modal";
import { ProjectCard } from "./project-card";

export type Project = {
  accessRole: ProjectAccessRole;
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  hasApiKey: boolean;
  invites: ProjectInvite[];
  members: ProjectMember[];
  settings: ProjectSettings;
};

export type ProjectSettings = {
  latencyEmailEnabled: boolean;
  latencyEmailRecipient: string | null;
  latencyErrorThresholdMs: number;
};

export type ProjectInvite = {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
};

export type ProjectMember = {
  id: string;
  email: string;
  name: string;
  role: ProjectMemberRole;
};

export type ProjectAccessRole = "admin" | "developer" | "owner" | "viewer";
export type ProjectMemberRole = "admin" | "developer" | "viewer";

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
  projectName: string;
  hasApiKey: boolean;
  logs: RequestLog[];
};

export type ProjectStats = {
  errorCount: number;
  health: "Has errors" | "Healthy" | "No traffic" | "Watch";
  lastRequestAt: string | null;
  lastStatus: number | null;
  requestCount: number;
  slowCount: number;
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

export function ProjectsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projectLogs, setProjectLogs] = useState<ProjectLogs[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    void loadPageData();
  }, []);

  async function loadPageData() {
    await Promise.all([loadProjects(), loadLogs()]);
  }

  async function loadProjects() {
    try {
      const response = await fetch(`${apiUrl}/projects`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load projects.");
      }

      const data = (await response.json()) as { projects: Project[] };
      const normalizedProjects = data.projects.map(normalizeProject);

      setProjects(normalizedProjects);
    } catch {
      toast.error("Could not load projects.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLogs() {
    try {
      const response = await fetch(`${apiUrl}/logs`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load project stats.");
      }

      const data = (await response.json()) as { projects: ProjectLogs[] };
      setProjectLogs(data.projects);
    } catch {
      toast.error("Could not load project stats.");
    }
  }

  const statsByProjectId = useMemo(() => {
    const stats = new Map<string, ProjectStats>();

    for (const project of projects) {
      const logs =
        projectLogs.find((item) => item.projectId === project.id)?.logs ?? [];
      const latencyThresholdMs = project.settings.latencyErrorThresholdMs;
      const sortedLogs = [...logs].sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
      );
      const latestLog = sortedLogs[0];
      const errorCount = logs.filter((log) => log.statusCode >= 400).length;
      const slowCount = logs.filter((log) =>
        isSlowRequest(log.durationMs, latencyThresholdMs)
      ).length;

      stats.set(project.id, {
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
      });
    }

    return stats;
  }, [projectLogs, projects]);

  const totalRequests = Array.from(statsByProjectId.values()).reduce(
    (total, stats) => total + stats.requestCount,
    0
  );
  const totalErrors = Array.from(statsByProjectId.values()).reduce(
    (total, stats) => total + stats.errorCount,
    0
  );
  const projectsWithErrors = Array.from(statsByProjectId.values()).filter(
    (stats) => stats.errorCount > 0
  ).length;
  const projectsWithSlowCalls = Array.from(statsByProjectId.values()).filter(
    (stats) => stats.slowCount > 0
  ).length;
  const metricBlocks = useMemo(
    () => [
      { label: "Projects", value: projects.length },
      { label: "Total requests", value: totalRequests },
      {
        helperText: "Project limit or higher",
        label: "Projects to watch",
        tone: projectsWithSlowCalls ? "danger" as const : "default" as const,
        value: projectsWithSlowCalls
      },
      {
        label: "Projects with errors",
        tone: "danger" as const,
        value: projectsWithErrors
      }
    ],
    [projects, projectsWithErrors, projectsWithSlowCalls, totalRequests]
  );
  const openCreateModal = useCallback(() => setIsCreateOpen(true), []);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const description = String(formData.get("description"));
    const name = String(formData.get("name"));
    const toastId = toast.loading("Creating project...");

    try {
      const response = await fetch(`${apiUrl}/projects`, {
        body: JSON.stringify({ description, name }),
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });

      const data = (await response.json()) as {
        apiKey?: string;
        error?: string;
        project?: Project;
      };

      if (!response.ok || !data.project || !data.apiKey) {
        toast.update(toastId, {
          autoClose: 4200,
          isLoading: false,
          render: data.error ?? "Could not create project.",
          type: "error"
        });
        return;
      }

      const project = normalizeProject(data.project);

      setProjects((current) => [project, ...current]);
      setIsCreateOpen(false);
      form.reset();
      toast.update(toastId, {
        autoClose: 3200,
        isLoading: false,
        render: "Project created. API key generated.",
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

  async function copyApiKey(projectId: string) {
    try {
      const response = await fetch(`${apiUrl}/projects/${projectId}/api-key`, {
        credentials: "include"
      });
      const data = (await response.json()) as {
        apiKey?: string;
        error?: string;
      };

      if (!response.ok || !data.apiKey) {
        if (response.status === 404) {
          await regenerateAndCopyApiKey(projectId);
          return;
        }

        toast.error(data.error ?? "Could not copy API key.");
        return;
      }

      await navigator.clipboard.writeText(data.apiKey);
      toast.success("API key copied.");
    } catch {
      toast.error("Could not reach the API server.");
    }
  }

  async function regenerateAndCopyApiKey(projectId: string) {
    try {
      const response = await fetch(
        `${apiUrl}/projects/${projectId}/api-key/regenerate`,
        {
          credentials: "include",
          method: "POST"
        }
      );
      const data = (await response.json()) as {
        apiKey?: string;
        error?: string;
      };

      if (!response.ok || !data.apiKey) {
        toast.error(data.error ?? "Could not regenerate API key.");
        return;
      }

      await navigator.clipboard.writeText(data.apiKey);
      toast.success("New API key generated and copied.");
    } catch {
      toast.error("Could not reach the API server.");
    }
  }

  return (
    <div className="grid gap-6">
      <MetricGrid blocks={metricBlocks} />

      <section className="min-w-0 rounded-3xl bg-panel p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">Project tiles</h2>
              <p className="mt-1 text-sm text-muted">
                Create one project per backend app. Select a tile to inspect it.
              </p>
            </div>
            <Button onClick={openCreateModal} type="button">
              Create project
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <p className="text-sm text-muted">Loading projects...</p>
            ) : null}

            {!isLoading && projects.length === 0 ? (
              <button
                className="rounded-3xl border border-dashed border-line bg-panel-strong p-8 text-left transition hover:bg-surface"
                onClick={openCreateModal}
                type="button"
              >
                <p className="text-lg font-black">No projects yet</p>
                <p className="mt-2 text-sm text-muted">
                  Create your first project to generate an API key.
                </p>
              </button>
            ) : null}

            {projects.map((project) => {
              return (
                <ProjectCard
                  key={project.id}
                  onCopyApiKey={copyApiKey}
                  project={project}
                  stats={statsByProjectId.get(project.id) ?? emptyProjectStats}
                />
              );
            })}
          </div>
      </section>

      {isCreateOpen ? (
        <CreateProjectModal
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateProject}
        />
      ) : null}
    </div>
  );
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
    latencyEmailEnabled: settings?.latencyEmailEnabled ?? false,
    latencyEmailRecipient: settings?.latencyEmailRecipient ?? null,
    latencyErrorThresholdMs:
      settings?.latencyErrorThresholdMs ?? defaultLatencyErrorThresholdMs
  };
}
