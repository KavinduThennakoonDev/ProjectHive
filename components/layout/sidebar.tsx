import Link from "next/link";
import { NavLinks } from "@/components/layout/nav-links";
import { Logo } from "@/components/shared/logo";

/** Fixed sidebar shown on large screens. Smaller screens use the menu in the header. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar lg:flex">
      <Link href="/dashboard" className="flex h-16 items-center border-b px-5">
        <Logo />
      </Link>
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks />
      </div>
      <p className="border-t px-5 py-3 text-xs text-muted-foreground">Internal project management</p>
    </aside>
  );
}
