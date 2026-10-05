import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { DeadlineIndicator } from "@/components/shared/deadline-indicator";
import { EmptyState } from "@/components/shared/states";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { ProjectDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DeadlineListProps {
  title: string;
  description: string;
  projects: ProjectDTO[];
  emptyIcon: LucideIcon;
  emptyTitle: string;
  /** Red styling for the overdue list. */
  urgent?: boolean;
}

/** A dashboard card listing projects by deadline (upcoming or overdue). */
export function DeadlineList({ title, description, projects, emptyIcon, emptyTitle, urgent }: DeadlineListProps) {
  const highlight = urgent && projects.length > 0;

  return (
    <Card className={cn(highlight && "ring-red-200")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {projects.length > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                highlight ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground",
              )}
            >
              {projects.length}
            </span>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} className="py-6" />
        ) : (
          <ul className="divide-y">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{project.projectName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {project.developer?.name ?? "Unassigned"} · Due {formatDate(project.deadline)}
                    </p>
                  </div>
                  <DeadlineIndicator deadline={project.deadline} status={project.status} labelOnly />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
