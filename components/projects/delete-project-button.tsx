"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

/** Delete button on the project page. Returns to the projects list afterwards. */
export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      await apiFetch(`/api/projects/${projectId}`, { method: "DELETE" });
      toast.success("Project deleted");
      router.push("/projects");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this project?"
        description={
          <>
            <span className="font-medium text-foreground">{projectName}</span> and its history will be permanently
            deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete project"
        pending={pending}
        onConfirm={handleDelete}
      />
    </>
  );
}
