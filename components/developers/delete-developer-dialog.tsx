"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

interface DeleteDeveloperDialogProps {
  /** The developer to delete, or null when the dialog is closed. */
  developer: { id: string; name: string } | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteDeveloperDialog({ developer, onClose, onDeleted }: DeleteDeveloperDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!developer) return;
    setPending(true);
    try {
      await apiFetch(`/api/developers/${developer.id}`, { method: "DELETE" });
      toast.success("Developer deleted");
      onDeleted();
    } catch (error) {
      toast.error(getErrorMessage(error));
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <ConfirmDialog
      open={developer !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Delete this developer?"
      description={
        <>
          <span className="font-medium text-foreground">{developer?.name}</span> will be permanently deleted. Developers
          with assigned projects cannot be deleted — mark them as Inactive instead.
        </>
      }
      confirmLabel="Delete developer"
      pending={pending}
      onConfirm={handleDelete}
    />
  );
}
