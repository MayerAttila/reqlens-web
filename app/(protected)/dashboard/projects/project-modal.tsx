import type { FormEvent } from "react";
import { Button } from "../../../../components/ui/button";
import { TextInput } from "../../../../components/ui/text-input";
import type { Project } from "./projects-panel";

type ProjectModalProps = {
  onClose: () => void;
  onDeleteProject: (project: Project) => Promise<void>;
  onInviteMember: (project: Project, email: string) => void;
  project: Project;
};

export function ProjectModal({
  onClose,
  onDeleteProject,
  onInviteMember,
  project
}: ProjectModalProps) {
  function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email"));

    onInviteMember(project, email);
    form.reset();
  }

  const isOwner = project.accessRole === "owner";

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-panel p-6 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-primary">
              Project
            </p>
            <h2 className="mt-2 text-3xl font-black">{project.name}</h2>
            <p className="mt-2 text-sm text-muted">
              {project.description || "No description yet."}
            </p>
          </div>
          <button
            aria-label="Close project modal"
            className="rounded-xl bg-surface px-3 py-2 text-sm text-muted transition hover:bg-surface-soft hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        {isOwner ? (
          <div className="mt-8 grid gap-4">
            <section className="rounded-2xl bg-panel-strong p-4">
              <h3 className="text-lg font-black">Invite member</h3>
              <p className="mt-2 text-sm text-muted">
                Invite by email. They will see this project after accepting.
              </p>
              <form className="mt-4 grid gap-3" onSubmit={handleInviteSubmit}>
                <TextInput
                  autoComplete="email"
                  name="email"
                  placeholder="teammate@example.com"
                  required
                  type="email"
                />
                <Button type="submit">Send invite</Button>
              </form>

              <div className="mt-5 grid gap-3 text-sm">
                <PeopleList
                  emptyText="No accepted members yet."
                  label="Members"
                  people={project.members.map((member) => member.email)}
                />
                <PeopleList
                  emptyText="No pending invites."
                  label="Pending"
                  people={project.invites.map((invite) => invite.email)}
                />
              </div>
            </section>

            <section className="rounded-2xl bg-red-500/10 p-4">
              <h3 className="text-lg font-black text-red-200">Delete project</h3>
              <p className="mt-2 text-sm text-muted">
                Deletes the project and saved request logs. Cannot be undone.
              </p>
            </section>
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-panel-strong p-4 text-sm text-muted">
            Shared with you. Owner-only actions are hidden.
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Close
          </Button>
          {isOwner ? (
            <button
              className="inline-flex items-center justify-center rounded-lg bg-red-500/15 px-5 py-3.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-300/40"
              onClick={() => void onDeleteProject(project)}
              type="button"
            >
              Delete project
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PeopleList({
  emptyText,
  label,
  people
}: {
  emptyText: string;
  label: string;
  people: string[];
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      {people.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {people.map((person) => (
            <span
              className="rounded-full bg-surface px-3 py-1 text-xs text-foreground"
              key={person}
            >
              {person}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">{emptyText}</p>
      )}
    </div>
  );
}
