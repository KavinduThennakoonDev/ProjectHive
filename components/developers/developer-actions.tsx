"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteDeveloperDialog } from "@/components/developers/delete-developer-dialog";
import { Button } from "@/components/ui/button";

/** Edit and Delete buttons on a developer's profile. */
export function DeveloperActions({ developer }: { developer: { id: string; name: string } }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button asChild variant="outline">
        <Link href={`/developers/${developer.id}/edit`}>
          <Pencil />
          Edit
        </Link>
      </Button>
      <Button variant="destructive" onClick={() => setConfirming(true)}>
        <Trash2 />
        Delete
      </Button>
      <DeleteDeveloperDialog
        developer={confirming ? developer : null}
        onClose={() => setConfirming(false)}
        onDeleted={() => {
          router.push("/developers");
          router.refresh();
        }}
      />
    </>
  );
}
