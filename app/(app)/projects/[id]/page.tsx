import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Pencil, Phone } from "lucide-react";
import { ActivityTimeline } from "@/components/projects/activity-timeline";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { FinancialSummary } from "@/components/projects/financial-summary";
import { PaymentDialog } from "@/components/projects/payment-dialog";
import { StatusSelect } from "@/components/projects/status-select";
import { PaymentStatusBadge, PriorityBadge, ProjectStatusBadge } from "@/components/shared/badges";
import { DeadlineIndicator } from "@/components/shared/deadline-indicator";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { PROJECT_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { getProject } from "@/lib/services/projects";
import { isObjectId } from "@/lib/validation/common";

export const metadata: Metadata = { title: "Project Details" };

function Detail({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm break-words whitespace-pre-line">{children}</dd>
    </div>
  );
}

const empty = <span className="text-muted-foreground">—</span>;

export default async function ProjectDetailsPage({ params }: PageProps<"/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const project = await getProject(id);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.projectName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{project.projectCode}</span>
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
            <DeadlineIndicator deadline={project.deadline} status={project.status} labelOnly />
          </span>
        }
        back={{ href: "/projects", label: "Back to projects" }}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/projects/${project.id}/edit`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <DeleteProjectButton projectId={project.id} projectName={project.projectName} />
          </>
        }
      />

      <div className="space-y-6">
        <section aria-label="Financial summary" className="space-y-4">
          <FinancialSummary
            clientPrice={project.clientPrice}
            developerCost={project.developerCost}
            advancePaid={project.advancePaid}
          />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              <dl className="flex flex-wrap gap-x-10 gap-y-4">
                <Detail label="Advance / Paid Amount">
                  <Money amount={project.advancePaid} className="text-base font-semibold" />
                </Detail>
                <Detail label="Remaining Payment">
                  <Money
                    amount={project.remainingAmount}
                    className={`text-base font-semibold ${project.remainingAmount > 0 ? "text-amber-700" : ""}`}
                  />
                </Detail>
                <Detail label="Payment Status">
                  <PaymentStatusBadge status={project.paymentStatus} />
                </Detail>
              </dl>
              <PaymentDialog project={project} />
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Detail label="Project Name">{project.projectName}</Detail>
                  <Detail label="Type">{PROJECT_TYPE_LABELS[project.projectType]}</Detail>
                  <Detail label="Client">
                    <span className="font-medium">{project.clientName}</span>
                    {project.clientPhone && (
                      <a href={`tel:${project.clientPhone}`} className="mt-1 flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                        <Phone className="size-3.5" />
                        {project.clientPhone}
                      </a>
                    )}
                    {project.clientEmail && (
                      <a href={`mailto:${project.clientEmail}`} className="mt-1 flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                        <Mail className="size-3.5" />
                        {project.clientEmail}
                      </a>
                    )}
                  </Detail>
                  <Detail label="Subject / Course">{project.subject || empty}</Detail>
                  <Detail label="Description" className="sm:col-span-2">
                    {project.description || empty}
                  </Detail>
                  <Detail label="Requirements" className="sm:col-span-2">
                    {project.requirements || empty}
                  </Detail>
                  <Detail label="Technology / Tools">{project.technologies || empty}</Detail>
                  <Detail label="Reference Materials">{project.referenceMaterials || empty}</Detail>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
                <CardAction>
                  <StatusSelect projectId={project.id} status={project.status} className="w-44" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Developer">
                    {project.developer ? (
                      <Link href={`/developers/${project.developer.id}`} className="font-medium hover:text-primary">
                        {project.developer.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Not assigned yet</span>
                    )}
                  </Detail>
                  <Detail label="Start Date">{formatDate(project.startDate)}</Detail>
                  <Detail label="Deadline">
                    <DeadlineIndicator deadline={project.deadline} status={project.status} />
                  </Detail>
                  <Detail label="Priority">
                    <PriorityBadge priority={project.priority} />
                  </Detail>
                  <Detail label="Status">
                    <ProjectStatusBadge status={project.status} />
                  </Detail>
                  <Detail label="Created">{formatDateTime(project.createdAt)}</Detail>
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card className="xl:self-start">
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={project.activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
