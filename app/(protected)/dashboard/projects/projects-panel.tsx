"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "../../../../components/ui/button";
import { CreateProjectModal } from "./create-project-modal";
import { ProjectCard } from "./project-card";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  hasApiKey: boolean;
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";

export function ProjectsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0];

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const response = await fetch(`${apiUrl}/projects`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load projects.");
      }

      const data = (await response.json()) as { projects: Project[] };
      setProjects(data.projects);
      setSelectedProjectId((current) => current || data.projects[0]?.id || "");
    } catch {
      toast.error("Could not load projects.");
    } finally {
      setIsLoading(false);
    }
  }

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

      const project = data.project;

      setProjects((current) => [project, ...current]);
      setSelectedProjectId(project.id);
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
      <section className="flex flex-col gap-4 rounded-3xl bg-panel p-6 shadow-2xl shadow-black/20 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Your projects</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Create one project per backend app. Each project owns API keys used by
            the Reqlens middleware. One project owns one API key.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} type="button">
          Create project
        </Button>
      </section>

      <section>
        <div className="rounded-3xl bg-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">Project tiles</h2>
            <span className="rounded-full bg-surface px-3 py-1 text-sm text-muted">
              {projects.length}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <p className="text-sm text-muted">Loading projects...</p>
            ) : null}

            {!isLoading && projects.length === 0 ? (
              <button
                className="rounded-3xl border border-dashed border-line bg-panel-strong p-8 text-left transition hover:bg-surface"
                onClick={() => setIsCreateOpen(true)}
                type="button"
              >
                <p className="text-lg font-black">No projects yet</p>
                <p className="mt-2 text-sm text-muted">
                  Create your first project to generate an API key.
                </p>
              </button>
            ) : null}

            {projects.map((project) => {
              const selected = project.id === selectedProject?.id;

              return (
                <ProjectCard
                  isSelected={selected}
                  key={project.id}
                  onCopyApiKey={copyApiKey}
                  onSelect={setSelectedProjectId}
                  project={project}
                />
              );
            })}
          </div>
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
