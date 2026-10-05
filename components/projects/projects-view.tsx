"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { ProjectRowActions } from "@/components/projects/project-row-actions";
import { saveProjectStatus } from "@/components/projects/status-select";
import { PaymentStatusBadge, ProjectStatusBadge } from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DeadlineIndicator } from "@/components/shared/deadline-indicator";
import { Money, Profit } from "@/components/shared/money";
import { OptionSelect, toOptions, type SelectOption } from "@/components/shared/option-select";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import {
  DEADLINE_FILTERS,
  DEADLINE_FILTER_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  type ProjectStatus,
} from "@/lib/constants";
import type { DeveloperSummary, ProjectDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL = "all";
const COLUMN_COUNT = 12;

interface Filters {
  status: string;
  projectType: string;
  developerId: string;
  paymentStatus: string;
  deadline: string;
}

const EMPTY_FILTERS: Filters = {
  status: ALL,
  projectType: ALL,
  developerId: ALL,
  paymentStatus: ALL,
  deadline: ALL,
};

const withAll = (label: string, options: SelectOption[]): SelectOption[] => [{ value: ALL, label }, ...options];

const STATUS_OPTIONS = withAll("All statuses", toOptions(PROJECT_STATUSES, PROJECT_STATUS_LABELS));
const TYPE_OPTIONS = withAll("All types", toOptions(PROJECT_TYPES, PROJECT_TYPE_LABELS));
const PAYMENT_OPTIONS = withAll("All payments", toOptions(PAYMENT_STATUSES, PAYMENT_STATUS_LABELS));
const DEADLINE_OPTIONS = withAll("Any deadline", toOptions(DEADLINE_FILTERS, DEADLINE_FILTER_LABELS));

interface LoadResult {
  /** The request this result belongs to. */
  key: string;
  projects: ProjectDTO[];
  error: string | null;
}

interface ProjectsViewProps {
  developers: DeveloperSummary[];
  initialSearch: string;
}

/** The projects table with search, filters and row actions. Data comes from GET /api/projects. */
export function ProjectsView({ developers, initialSearch }: ProjectsViewProps) {
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const developerOptions = useMemo(
    () =>
      withAll("All developers", [
        { value: "unassigned", label: "Unassigned" },
        ...developers.map((developer) => ({ value: developer.id, label: developer.name })),
      ]),
    [developers],
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    for (const [key, value] of Object.entries(filters)) {
      if (value !== ALL) params.set(key, value);
    }
    return params.toString();
  }, [debouncedSearch, filters]);

  const requestKey = `${queryString}#${reloadCount}`;

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<ProjectDTO[]>(`/api/projects?${queryString}`, { signal: controller.signal })
      .then((projects) => setResult({ key: requestKey, projects, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult((previous) => ({
          key: requestKey,
          projects: previous?.projects ?? [],
          error: getErrorMessage(error),
        }));
      });
    return () => controller.abort();
  }, [queryString, requestKey]);

  const loading = result?.key !== requestKey;
  const projects = result?.projects ?? [];
  const hasFilters = search.trim() !== "" || Object.values(filters).some((value) => value !== ALL);
  const reload = () => setReloadCount((count) => count + 1);

  function setFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setSearch("");
    setFilters(EMPTY_FILTERS);
  }

  async function handleStatusChange(project: ProjectDTO, status: ProjectStatus) {
    if (status === project.status) return;
    if (await saveProjectStatus(project.id, status)) reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Project deleted");
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project name, client, phone, developer or project ID"
            aria-label="Search projects"
            className="h-9 pl-8"
            maxLength={100}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
          <OptionSelect
            value={filters.status}
            onValueChange={(value) => setFilter("status", value)}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />
          <OptionSelect
            value={filters.projectType}
            onValueChange={(value) => setFilter("projectType", value)}
            options={TYPE_OPTIONS}
            aria-label="Filter by project type"
          />
          <OptionSelect
            value={filters.developerId}
            onValueChange={(value) => setFilter("developerId", value)}
            options={developerOptions}
            aria-label="Filter by developer"
          />
          <OptionSelect
            value={filters.paymentStatus}
            onValueChange={(value) => setFilter("paymentStatus", value)}
            options={PAYMENT_OPTIONS}
            aria-label="Filter by payment status"
          />
          <OptionSelect
            value={filters.deadline}
            onValueChange={(value) => setFilter("deadline", value)}
            options={DEADLINE_OPTIONS}
            aria-label="Filter by deadline"
          />
          <Button variant="ghost" onClick={clearFilters} disabled={!hasFilters}>
            <X />
            Clear
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {result?.error ? (
          <ErrorState title="Could not load projects" message={result.error} onRetry={reload} />
        ) : result && projects.length === 0 && !loading ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="No projects match your search"
              description="Try a different search term or clear the filters."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to start tracking deadlines, payments and profit."
              action={
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus />
                    New Project
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <Table aria-busy={loading}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Project ID</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Developer Cost</TableHead>
                <TableHead className="text-right">Client Price</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn(loading && result && "opacity-60 transition-opacity")}>
              {!result
                ? Array.from({ length: 6 }, (_, row) => (
                    <TableRow key={row} className="hover:bg-transparent">
                      {Array.from({ length: COLUMN_COUNT }, (_, column) => (
                        <TableCell key={column} className={cn(column === 0 && "pl-4")}>
                          <Skeleton className="h-5 w-full min-w-12" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                        {project.projectCode}
                      </TableCell>
                      <TableCell className="max-w-56">
                        <Link
                          href={`/projects/${project.id}`}
                          className="block truncate font-medium hover:text-primary"
                          title={project.projectName}
                        >
                          {project.projectName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {PROJECT_TYPE_LABELS[project.projectType]}
                      </TableCell>
                      <TableCell>
                        <div>{project.clientName}</div>
                        {project.clientPhone && (
                          <div className="text-xs text-muted-foreground">{project.clientPhone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.developer?.name ?? <span className="text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell>
                        <DeadlineIndicator deadline={project.deadline} status={project.status} />
                      </TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={project.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={project.developerCost} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={project.clientPrice} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Profit amount={project.profit} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={project.paymentStatus} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <ProjectRowActions
                          project={project}
                          onStatusChange={handleStatusChange}
                          onDelete={setDeleteTarget}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </div>

      {result && !result.error && projects.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {projects.length} project{projects.length === 1 ? "" : "s"}
        </p>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this project?"
        description={
          <>
            <span className="font-medium text-foreground">{deleteTarget?.projectName}</span> and its history will be
            permanently deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete project"
        pending={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
