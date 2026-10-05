"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ellipsis, Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { DeleteDeveloperDialog } from "@/components/developers/delete-developer-dialog";
import { DeveloperStatusBadge } from "@/components/shared/badges";
import { Money } from "@/components/shared/money";
import { OptionSelect, toOptions } from "@/components/shared/option-select";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEVELOPER_STATUSES, DEVELOPER_STATUS_LABELS } from "@/lib/constants";
import type { DeveloperDTO } from "@/lib/types";

const ALL = "all";
const MAX_VISIBLE_SKILLS = 3;
const STATUS_OPTIONS = [{ value: ALL, label: "All statuses" }, ...toOptions(DEVELOPER_STATUSES, DEVELOPER_STATUS_LABELS)];

/** The developers table with search and a status filter. */
export function DevelopersView({ developers }: { developers: DeveloperDTO[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [deleteTarget, setDeleteTarget] = useState<DeveloperDTO | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return developers.filter((developer) => {
      if (status !== ALL && developer.status !== status) return false;
      if (!term) return true;
      return [developer.name, developer.email, developer.phone, ...developer.skills].some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  }, [developers, search, status]);

  if (developers.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={Users}
          title="No developers yet"
          description="Add the developers you work with so you can assign projects to them."
          action={
            <Button asChild>
              <Link href="/developers/new">
                <Plus />
                Add Developer
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone or skill"
            aria-label="Search developers"
            className="h-9 pl-8"
          />
        </div>
        <OptionSelect
          value={status}
          onValueChange={setStatus}
          options={STATUS_OPTIONS}
          aria-label="Filter by status"
          className="h-9 sm:w-44"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {visible.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No developers match your search"
            description="Try a different search term or status."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Developer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((developer) => (
                <TableRow key={developer.id}>
                  <TableCell className="pl-4">
                    <Link href={`/developers/${developer.id}`} className="font-medium hover:text-primary">
                      {developer.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>{developer.phone || <span className="text-muted-foreground">—</span>}</div>
                    {developer.email && <div className="text-xs text-muted-foreground">{developer.email}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {developer.skills.slice(0, MAX_VISIBLE_SKILLS).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {developer.skills.length > MAX_VISIBLE_SKILLS && (
                        <Badge variant="outline">+{developer.skills.length - MAX_VISIBLE_SKILLS}</Badge>
                      )}
                      {developer.skills.length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DeveloperStatusBadge status={developer.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{developer.stats.assignedProjects}</TableCell>
                  <TableCell className="text-right tabular-nums">{developer.stats.activeProjects}</TableCell>
                  <TableCell className="text-right tabular-nums">{developer.stats.completedProjects}</TableCell>
                  <TableCell className="text-right">
                    <Money amount={developer.stats.totalDeveloperCost} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${developer.name}`}>
                          <Ellipsis />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link href={`/developers/${developer.id}`}>
                            <Eye />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/developers/${developer.id}/edit`}>
                            <Pencil />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(developer)}>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <DeleteDeveloperDialog
        developer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null);
          router.refresh();
        }}
      />
    </div>
  );
}
