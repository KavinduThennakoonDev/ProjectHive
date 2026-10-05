"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import type { AdminDTO } from "@/lib/types";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ admin }: { admin: AdminDTO }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      // Drop every page cached for the session that just ended.
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label="Account menu">
          <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
            {getInitials(admin.name) || "A"}
          </span>
          <span className="hidden max-w-36 truncate text-sm font-medium md:inline">{admin.name}</span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">{admin.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{admin.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={loggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          {loggingOut ? <LoaderCircle className="animate-spin" /> : <LogOut />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
