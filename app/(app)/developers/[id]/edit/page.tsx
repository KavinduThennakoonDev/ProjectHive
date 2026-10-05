import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeveloperForm } from "@/components/developers/developer-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { getDeveloper } from "@/lib/services/developers";
import { isObjectId } from "@/lib/validation/common";

export const metadata: Metadata = { title: "Edit Developer" };

export default async function EditDeveloperPage({ params }: PageProps<"/developers/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const developer = await getDeveloper(id);
  if (!developer) notFound();

  return (
    <>
      <PageHeader
        title="Edit Developer"
        description={developer.name}
        back={{ href: `/developers/${developer.id}`, label: "Back to developer" }}
      />
      <DeveloperForm developer={developer} />
    </>
  );
}
