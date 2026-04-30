import { CopyIcon } from "../../../../components/icons";
import { Project } from "./projects-panel";

type ProjectCardProps = {
  isSelected: boolean;
  onCopyApiKey: (projectId: string) => void;
  onSelect: (projectId: string) => void;
  project: Project;
};

export function ProjectCard({
  isSelected,
  onCopyApiKey,
  onSelect,
  project
}: ProjectCardProps) {
  return (
    <article
      className={`rounded-3xl p-5 text-left transition ${
        isSelected
          ? "bg-primary text-white shadow-xl shadow-primary/20"
          : "bg-panel-strong text-foreground hover:bg-surface"
      }`}
    >
      <button
        className="block w-full text-left"
        onClick={() => onSelect(project.id)}
        type="button"
      >
        <h3 className="text-lg font-black">{project.name}</h3>
        <p
          className={`mt-2 line-clamp-2 text-sm ${
            isSelected ? "text-white/75" : "text-muted"
          }`}
        >
          {project.description || "No description yet."}
        </p>
      </button>

      <div className="mt-5 grid gap-3 text-xs md:grid-cols-3">
        <CardMetric isSelected={isSelected} label="Requests" value="0" />
        <CardMetric isSelected={isSelected} label="Errors" value="0" />
        <CardMetric isSelected={isSelected} label="Last status" value="-" />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className={`text-xs ${isSelected ? "text-white/65" : "text-muted"}`}>
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
        {project.hasApiKey ? (
          <button
            aria-label={`Copy API key for ${project.name}`}
            className={`rounded-xl p-2 transition ${
              isSelected
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-surface text-muted hover:bg-surface-soft hover:text-foreground"
            }`}
            onClick={() => onCopyApiKey(project.id)}
            type="button"
          >
            <CopyIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function CardMetric({
  isSelected,
  label,
  value
}: {
  isSelected: boolean;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className={isSelected ? "text-white/60" : "text-muted"}>{label}</p>
      <p className="mt-1 text-base font-black">{value}</p>
    </div>
  );
}
