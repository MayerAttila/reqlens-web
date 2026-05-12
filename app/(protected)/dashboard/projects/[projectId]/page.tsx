import { DashboardPage } from "../../../../../components/dashboard/dashboard-page";
import { ProjectDetailPanel } from "../project-detail-panel";

type ProjectDetailsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDetailsPage({
  params
}: ProjectDetailsPageProps) {
  const { projectId } = await params;

  return (
    <DashboardPage>
      <ProjectDetailPanel projectId={projectId} />
    </DashboardPage>
  );
}
