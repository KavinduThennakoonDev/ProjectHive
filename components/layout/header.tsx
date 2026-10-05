import Link from "next/link";
import { Plus } from "lucide-react";
import { GlobalSearch } from "@/components/layout/global-search";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import type { AdminDTO } from "@/lib/types";

export function Header({ admin }: { admin: AdminDTO }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card px-4 md:px-6 lg:px-8">
      <MobileNav />
      <div className="flex-1">
        <GlobalSearch />
      </div>
      <Button asChild size="lg">
        <Link href="/projects/new">
          <Plus />
          <span className="hidden sm:inline">New Project</span>
        </Link>
      </Button>
      <UserMenu admin={admin} />
    </header>
  );
}
