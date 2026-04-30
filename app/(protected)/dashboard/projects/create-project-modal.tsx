import { FormEvent } from "react";
import { Button } from "../../../../components/ui/button";
import { TextInput } from "../../../../components/ui/text-input";

type CreateProjectModalProps = {
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function CreateProjectModal({
  onClose,
  onSubmit
}: CreateProjectModalProps) {
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
