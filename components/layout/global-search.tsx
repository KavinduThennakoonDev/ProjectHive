"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Header search box: jumps to the projects list filtered by the search text. */
export function GlobalSearch() {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(query ? `/projects?q=${encodeURIComponent(query)}` : "/projects");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        type="search"
        placeholder="Search projects, clients, developers…"
        aria-label="Search projects"
        className="h-9 bg-background pl-8"
        maxLength={100}
      />
    </form>
  );
}
