"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CopyIcon } from "../icons";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

type Project = {
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
      const response = await fetch(`${apiUrl}/dashboard/projects`, {
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
      const response = await fetch(`${apiUrl}/dashboard/projects`, {
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
      const response = await fetch(`${apiUrl}/dashboard/projects/${projectId}/api-key`, {
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
              const hasKey = project.hasApiKey;

              return (
                <article
                  className={`rounded-3xl p-5 text-left transition ${
                    selected
                      ? "bg-primary text-white shadow-xl shadow-primary/20"
                      : "bg-panel-strong text-foreground hover:bg-surface"
                  }`}
                  key={project.id}
                >
                  <button
                    className="block w-full text-left"
                    onClick={() => setSelectedProjectId(project.id)}
                    type="button"
                  >
                    <h3 className="text-lg font-black">{project.name}</h3>
                    <p
                      className={`mt-2 line-clamp-2 text-sm ${
                        selected ? "text-white/75" : "text-muted"
                      }`}
                    >
                      {project.description || "No description yet."}
                    </p>
                  </button>

                  <div className="mt-5 grid gap-3 text-xs md:grid-cols-3">
                    <div>
                      <p className={selected ? "text-white/60" : "text-muted"}>
                        Requests
                      </p>
                      <p className="mt-1 text-base font-black">0</p>
                    </div>
                    <div>
                      <p className={selected ? "text-white/60" : "text-muted"}>
                        Errors
                      </p>
                      <p className="mt-1 text-base font-black">0</p>
                    </div>
                    <div>
                      <p className={selected ? "text-white/60" : "text-muted"}>
                        Last status
                      </p>
                      <p className="mt-1 text-base font-black">-</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className={`text-xs ${selected ? "text-white/65" : "text-muted"}`}>
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                    {hasKey ? (
                      <button
                        aria-label={`Copy API key for ${project.name}`}
                        className={`rounded-xl p-2 transition ${
                          selected
                            ? "bg-white/15 text-white hover:bg-white/25"
                            : "bg-surface text-muted hover:bg-surface-soft hover:text-foreground"
                        }`}
                        onClick={() => copyApiKey(project.id)}
                        type="button"
                      >
                        <CopyIcon className="h-5 w-5" />
                      </button>
                    ) : null}
                  </div>
                </article>
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

function CreateProjectModal({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
      <form
        className="w-full max-w-xl rounded-[2rem] bg-panel p-6 shadow-2xl shadow-black/50"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-primary">
              New project
            </p>
            <h2 className="mt-2 text-3xl font-black">Create project</h2>
            <p className="mt-2 text-sm text-muted">
              Add the project info now. The API key is generated after creation.
            </p>
          </div>
          <button
            aria-label="Close create project modal"
            className="rounded-xl bg-surface px-3 py-2 text-sm text-muted transition hover:bg-surface-soft hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-6">
          <TextInput
            autoComplete="off"
            name="name"
            placeholder="Project name"
            required
          />
          <label className="grid gap-2">
            <textarea
              className="min-h-32 resize-none rounded-2xl bg-background p-4 text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/40"
              maxLength={240}
              name="description"
              placeholder="Description, for example: Express backend for checkout APIs"
            />
          </label>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button type="submit">Create and generate key</Button>
        </div>
      </form>
    </div>
  );
}
