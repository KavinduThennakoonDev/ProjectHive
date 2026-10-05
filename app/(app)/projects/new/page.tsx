import type { Metadata } from "next";
import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { listDeveloperOptions } from "@/lib/services/developers";

export const metadata: Metadata = { title: "New Project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const developers = await listDeveloperOptions();

  return (
    <>
      <PageHeader
        title="New Project"
        description="A project ID is generated automatically when you save."
        back={{ href: "/projects", label: "Back to projects" }}
      />
      <ProjectForm developers={developers} />
    </>
  );
}
