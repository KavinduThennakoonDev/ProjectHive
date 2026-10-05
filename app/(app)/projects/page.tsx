import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectsView } from "@/components/projects/projects-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { listDeveloperOptions } from "@/lib/services/developers";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  await requireAdmin();
  const [{ q }, developers] = await Promise.all([searchParams, listDeveloperOptions()]);
  const initialSearch = typeof q === "string" ? q.slice(0, 100) : "";

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every assignment, research and software project in one place."
        actions={
          <Button asChild size="lg">
            <Link href="/projects/new">
              <Plus />
              New Project
            </Link>
          </Button>
        }
      />
      {/* The key resets the table when a new search arrives from the header. */}
      <ProjectsView key={initialSearch} developers={developers} initialSearch={initialSearch} />
    </>
  );
}
