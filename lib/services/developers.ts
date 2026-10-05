import type { Developer, Prisma } from "@prisma/client";
import { ApiError } from "@/lib/errors";
import { ACTIVE_STATUSES, PENDING_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/finance";
import { projectInclude, toProjectDTO } from "@/lib/services/projects";
import type { DeveloperDetailDTO, DeveloperDTO, DeveloperStats, DeveloperSummary, ProjectDTO } from "@/lib/types";
import type { DeveloperInput, DeveloperQuery } from "@/lib/validation/developer";

type StatsProject = Pick<ProjectDTO, "status" | "developerCost">;

/** Cancelled projects still count as assigned, but not towards the developer's cost. */
function calculateStats(projects: StatsProject[]): DeveloperStats {
  const openStatuses = [...ACTIVE_STATUSES, ...PENDING_STATUSES];
  return {
    assignedProjects: projects.length,
    activeProjects: projects.filter((project) => openStatuses.includes(project.status)).length,
    completedProjects: projects.filter((project) => project.status === "COMPLETED").length,
    totalDeveloperCost: roundMoney(
      projects
        .filter((project) => project.status !== "CANCELLED")
        .reduce((total, project) => total + project.developerCost, 0),
    ),
  };
}

function toDeveloperDTO(developer: Developer, projects: StatsProject[]): DeveloperDTO {
  return {
    id: developer.id,
    name: developer.name,
    phone: developer.phone,
    email: developer.email,
    skills: developer.skills,
    notes: developer.notes,
    status: developer.status,
    createdAt: developer.createdAt.toISOString(),
    updatedAt: developer.updatedAt.toISOString(),
    stats: calculateStats(projects),
  };
}

export async function listDevelopers(query: DeveloperQuery = {}): Promise<DeveloperDTO[]> {
  const where: Prisma.DeveloperWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.q) {
    const contains = { contains: query.q, mode: "insensitive" } as const;
    where.OR = [{ name: contains }, { email: contains }, { phone: contains }, { skills: { has: query.q } }];
  }

  const developers = await prisma.developer.findMany({
    where,
    orderBy: { name: "asc" },
    include: { projects: { select: { status: true, developerCost: true } } },
  });
  return developers.map(({ projects, ...developer }) => toDeveloperDTO(developer, projects));
}

/** Developers for the "assign developer" dropdowns. */
export async function listDeveloperOptions(): Promise<DeveloperSummary[]> {
  return prisma.developer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true },
  });
}

export async function getDeveloper(id: string): Promise<DeveloperDetailDTO | null> {
  const developer = await prisma.developer.findUnique({
    where: { id },
    include: { projects: { include: projectInclude, orderBy: { deadline: "asc" } } },
  });
  if (!developer) return null;

  const { projects, ...rest } = developer;
  const projectDTOs = projects.map(toProjectDTO);
  return { ...toDeveloperDTO(rest, projectDTOs), projects: projectDTOs };
}

export async function createDeveloper(input: DeveloperInput): Promise<DeveloperDTO> {
  const developer = await prisma.developer.create({ data: input });
  return toDeveloperDTO(developer, []);
}

export async function updateDeveloper(id: string, input: DeveloperInput): Promise<DeveloperDTO> {
  const existing = await prisma.developer.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, "Developer not found.");

  const developer = await prisma.developer.update({
    where: { id },
    data: input,
    include: { projects: { select: { status: true, developerCost: true } } },
  });
  const { projects, ...rest } = developer;
  return toDeveloperDTO(rest, projects);
}

export async function deleteDeveloper(id: string): Promise<void> {
  const developer = await prisma.developer.findUnique({
    where: { id },
    select: { _count: { select: { projects: true } } },
  });
  if (!developer) throw new ApiError(404, "Developer not found.");

  // Keeping the developer preserves the cost history of their projects.
  if (developer._count.projects > 0) {
    throw new ApiError(
      409,
      "This developer has projects assigned. Reassign those projects first, or mark the developer as Inactive.",
    );
  }
  await prisma.developer.delete({ where: { id } });
}
