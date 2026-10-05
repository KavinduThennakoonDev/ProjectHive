"use client";

import Link from "next/link";
import { Ellipsis, Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import type { ProjectDTO } from "@/lib/types";

interface ProjectRowActionsProps {
  project: ProjectDTO;
  onStatusChange: (project: ProjectDTO, status: ProjectStatus) => void;
  onDelete: (project: ProjectDTO) => void;
}

/** The "..." menu at the end of each row in the projects table. */
export function ProjectRowActions({ project, onStatusChange, onDelete }: ProjectRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${project.projectName}`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/projects/${project.id}`}>
            <Eye />
            View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/projects/${project.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <RefreshCw />
            Change status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={project.status}
              onValueChange={(status) => onStatusChange(project, status as ProjectStatus)}
            >
              {PROJECT_STATUSES.map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(project)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
