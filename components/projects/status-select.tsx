"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OptionSelect, toOptions } from "@/components/shared/option-select";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import type { ProjectDTO } from "@/lib/types";

const STATUS_OPTIONS = toOptions(PROJECT_STATUSES, PROJECT_STATUS_LABELS);

/** Saves a new project status. Shared by the status dropdown and the row menu. */
export async function saveProjectStatus(projectId: string, status: ProjectStatus): Promise<boolean> {
  try {
    await apiFetch<ProjectDTO>(`/api/projects/${projectId}`, { method: "PATCH", body: { status } });
    toast.success(`Status changed to ${PROJECT_STATUS_LABELS[status]}`);
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error));
    return false;
  }
}

interface StatusSelectProps {
  projectId: string;
  status: ProjectStatus;
  className?: string;
}

/** Dropdown on the project page that changes the status straight away. */
export function StatusSelect({ projectId, status, className }: StatusSelectProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(next: string) {
    if (next === status) return;
    setPending(true);
    if (await saveProjectStatus(projectId, next as ProjectStatus)) router.refresh();
    setPending(false);
  }

  return (
    <OptionSelect
      value={status}
      onValueChange={handleChange}
      options={STATUS_OPTIONS}
      disabled={pending}
      aria-label="Project status"
      className={className}
    />
  );
}
