import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleCheck, FolderKanban, Mail, Phone, Wallet, Zap } from "lucide-react";
import { DeveloperActions } from "@/components/developers/developer-actions";
import { ProjectSummaryTable } from "@/components/projects/project-summary-table";
import { DeveloperStatusBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { CLOSED_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { getDeveloper } from "@/lib/services/developers";
import type { ProjectDTO } from "@/lib/types";
import { isObjectId } from "@/lib/validation/common";

export const metadata: Metadata = { title: "Developer" };

function ProjectsCard({ title, description, projects, emptyTitle }: { title: string; description: string; projects: ProjectDTO[]; emptyTitle: string }) {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title={emptyTitle} className="py-8" />
      ) : (
        <ProjectSummaryTable projects={projects} hideDeveloper />
      )}
    </Card>
  );
}

export default async function DeveloperProfilePage({ params }: PageProps<"/developers/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const developer = await getDeveloper(id);
  if (!developer) notFound();

  const currentProjects = developer.projects.filter((project) => !CLOSED_STATUSES.includes(project.status));
  const pastProjects = developer.projects.filter((project) => CLOSED_STATUSES.includes(project.status));

  return (
    <>
      <PageHeader
        title={developer.name}
        description={<DeveloperStatusBadge status={developer.status} />}
        back={{ href: "/developers", label: "Back to developers" }}
        actions={<DeveloperActions developer={{ id: developer.id, name: developer.name }} />}
      />

      <div className="space-y-6">
        <section aria-label="Developer statistics" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Assigned Projects" value={developer.stats.assignedProjects} icon={FolderKanban} tone="blue" />
          <StatCard label="Active Projects" value={developer.stats.activeProjects} icon={Zap} tone="blue" />
          <StatCard label="Completed Projects" value={developer.stats.completedProjects} icon={CircleCheck} tone="green" />
          <StatCard
            label="Total Developer Cost"
            value={formatCurrency(developer.stats.totalDeveloperCost)}
            icon={Wallet}
            hint="Excludes cancelled projects"
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Contact</p>
              {developer.phone ? (
                <a href={`tel:${developer.phone}`} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="size-4 text-muted-foreground" />
                  {developer.phone}
                </a>
              ) : null}
              {developer.email ? (
                <a href={`mailto:${developer.email}`} className="flex items-center gap-2 hover:text-primary">
                  <Mail className="size-4 text-muted-foreground" />
                  {developer.email}
                </a>
              ) : null}
              {!developer.phone && !developer.email && <p className="text-muted-foreground">No contact details</p>}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Skills</p>
              {developer.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {developer.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No skills listed</p>
              )}
            </div>
            {developer.notes && (
              <div className="space-y-2 sm:col-span-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Notes</p>
                <p className="whitespace-pre-line">{developer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <ProjectsCard
          title="Projects Currently Assigned"
          description="Open projects this developer is working on."
          projects={currentProjects}
          emptyTitle="No projects currently assigned"
        />
        {pastProjects.length > 0 && (
          <ProjectsCard
            title="Past Projects"
            description="Completed and cancelled projects."
            projects={pastProjects}
            emptyTitle="No past projects"
          />
        )}
      </div>
    </>
  );
}
