import Link from "next/link";
import { ProjectStatusBadge } from "@/components/shared/badges";
import { DeadlineIndicator } from "@/components/shared/deadline-indicator";
import { Money, Profit } from "@/components/shared/money";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProjectDTO } from "@/lib/types";

interface ProjectSummaryTableProps {
  projects: ProjectDTO[];
  /** Hide the developer column, e.g. on a developer's own profile. */
  hideDeveloper?: boolean;
}

/** A read-only project table used on the dashboard and developer profile. */
export function ProjectSummaryTable({ projects, hideDeveloper = false }: ProjectSummaryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Project</TableHead>
          <TableHead>Client</TableHead>
          {!hideDeveloper && <TableHead>Developer</TableHead>}
          <TableHead>Deadline</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Client Price</TableHead>
          <TableHead className="text-right">Developer Cost</TableHead>
          <TableHead className="pr-4 text-right">Profit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="max-w-64 pl-4">
              <Link href={`/projects/${project.id}`} className="block truncate font-medium hover:text-primary">
                {project.projectName}
              </Link>
              <span className="text-xs text-muted-foreground">{project.projectCode}</span>
            </TableCell>
            <TableCell>{project.clientName}</TableCell>
            {!hideDeveloper && (
              <TableCell>
                {project.developer?.name ?? <span className="text-muted-foreground">Unassigned</span>}
              </TableCell>
            )}
            <TableCell>
              <DeadlineIndicator deadline={project.deadline} status={project.status} />
            </TableCell>
            <TableCell>
              <ProjectStatusBadge status={project.status} />
            </TableCell>
            <TableCell className="text-right">
              <Money amount={project.clientPrice} />
            </TableCell>
            <TableCell className="text-right">
              <Money amount={project.developerCost} />
            </TableCell>
            <TableCell className="pr-4 text-right">
              <Profit amount={project.profit} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
