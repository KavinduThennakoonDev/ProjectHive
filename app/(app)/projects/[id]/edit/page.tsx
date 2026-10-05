import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { listDeveloperOptions } from "@/lib/services/developers";
import { getProject } from "@/lib/services/projects";
import { isObjectId } from "@/lib/validation/common";

export const metadata: Metadata = { title: "Edit Project" };

export default async function EditProjectPage({ params }: PageProps<"/projects/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const [project, developers] = await Promise.all([getProject(id), listDeveloperOptions()]);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title="Edit Project"
        description={`${project.projectCode} · ${project.projectName}`}
        back={{ href: `/projects/${project.id}`, label: "Back to project" }}
      />
      <ProjectForm developers={developers} project={project} />
    </>
  );
}
