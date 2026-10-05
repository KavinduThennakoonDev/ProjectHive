import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DevelopersView } from "@/components/developers/developers-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { listDevelopers } from "@/lib/services/developers";

export const metadata: Metadata = { title: "Developers" };

export default async function DevelopersPage() {
  await requireAdmin();
  const developers = await listDevelopers();

  return (
    <>
      <PageHeader
        title="Developers"
        description="The developers ProjectHive assigns work to, and what they have cost so far."
        actions={
          <Button asChild size="lg">
            <Link href="/developers/new">
              <Plus />
              Add Developer
            </Link>
          </Button>
        }
      />
      <DevelopersView developers={developers} />
    </>
  );
}
