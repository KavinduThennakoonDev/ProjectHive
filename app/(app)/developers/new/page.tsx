import type { Metadata } from "next";
import { DeveloperForm } from "@/components/developers/developer-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Add Developer" };

export default async function NewDeveloperPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Add Developer" back={{ href: "/developers", label: "Back to developers" }} />
      <DeveloperForm />
    </>
  );
}
