import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/errors";
import {
  CLOSED_STATUSES,
  PAYMENT_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type ActivityAction,
  type PaymentStatus,
  type Priority,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/constants";
import { addDays, parseDateOnly, today } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { calculateFinancials, derivePaymentStatus } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { nextProjectCode } from "@/lib/services/project-code";
import type { ProjectDetailDTO, ProjectDTO } from "@/lib/types";
import type { ProjectInput, ProjectPatch, ProjectQuery } from "@/lib/validation/project";

const developerSelect = { id: true, name: true, status: true } satisfies Prisma.DeveloperSelect;
export const projectInclude = { developer: { select: developerSelect } } satisfies Prisma.ProjectInclude;
type ProjectWithDeveloper = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

/** The editable state of a project, as stored in the database. */
interface ProjectState {
  projectName: string;
  projectType: ProjectType;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  description: string;
  subject: string;
  requirements: string;
  technologies: string;
  referenceMaterials: string;
  developerId: string | null;
  startDate: Date | null;
  deadline: Date;
  priority: Priority;
  status: ProjectStatus;
  developerCost: number;
  clientPrice: number;
  advancePaid: number;
  paymentStatus: PaymentStatus;
}

interface ActivityEntry {
  action: ActivityAction;
  description: string;
}

const DETAIL_FIELDS = [
  "projectName",
  "projectType",
  "clientName",
  "clientPhone",
  "clientEmail",
  "description",
  "subject",
  "requirements",
  "technologies",
  "referenceMaterials",
  "priority",
] as const satisfies readonly (keyof ProjectState)[];

/** Converts a database project into the API shape, with all money values calculated on the server. */
export function toProjectDTO(project: ProjectWithDeveloper): ProjectDTO {
  return {
    id: project.id,
    projectCode: project.projectCode,
    projectName: project.projectName,
    projectType: project.projectType,
    clientName: project.clientName,
    clientPhone: project.clientPhone,
    clientEmail: project.clientEmail,
    description: project.description,
    subject: project.subject,
    requirements: project.requirements,
    technologies: project.technologies,
    referenceMaterials: project.referenceMaterials,
    developerId: project.developerId,
    developer: project.developer,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    deadline: project.deadline.toISOString(),
    priority: project.priority,
    status: project.status,
    developerCost: project.developerCost,
    clientPrice: project.clientPrice,
    advancePaid: project.advancePaid,
    paymentStatus: project.paymentStatus,
    ...calculateFinancials(project),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function inputToState(input: ProjectInput): ProjectState {
  return {
    projectName: input.projectName,
    projectType: input.projectType,
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    clientEmail: input.clientEmail,
    description: input.description,
    subject: input.subject,
    requirements: input.requirements,
    technologies: input.technologies,
    referenceMaterials: input.referenceMaterials,
    developerId: input.developerId,
    startDate: input.startDate ? parseDateOnly(input.startDate) : null,
    deadline: parseDateOnly(input.deadline),
    priority: input.priority,
    status: input.status,
    developerCost: input.developerCost,
    clientPrice: input.clientPrice,
    advancePaid: input.advancePaid,
    paymentStatus: derivePaymentStatus(input.clientPrice, input.advancePaid, input.refunded),
  };
}

function recordToState(project: ProjectWithDeveloper): ProjectState {
  return {
    projectName: project.projectName,
    projectType: project.projectType,
    clientName: project.clientName,
    clientPhone: project.clientPhone,
    clientEmail: project.clientEmail,
    description: project.description,
    subject: project.subject,
    requirements: project.requirements,
    technologies: project.technologies,
    referenceMaterials: project.referenceMaterials,
    developerId: project.developerId,
    startDate: project.startDate,
    deadline: project.deadline,
    priority: project.priority,
    status: project.status,
    developerCost: project.developerCost,
    clientPrice: project.clientPrice,
    advancePaid: project.advancePaid,
    paymentStatus: project.paymentStatus,
  };
}

async function getDeveloperName(developerId: string | null): Promise<string | null> {
  if (!developerId) return null;
  const developer = await prisma.developer.findUnique({ where: { id: developerId }, select: { name: true } });
  if (!developer) {
    throw new ApiError(422, "Please check the highlighted fields.", {
      developerId: "The selected developer no longer exists",
    });
  }
  return developer.name;
}

/** A project that has a developer is at least "Assigned". */
function withAssignedStatus(state: ProjectState, developerWasAssigned: boolean): ProjectState {
  if (state.developerId && !developerWasAssigned && state.status === "NEW") {
    return { ...state, status: "ASSIGNED" };
  }
  return state;
}

function paymentSummary(state: ProjectState): string {
  return `${formatCurrency(state.advancePaid)} of ${formatCurrency(state.clientPrice)} paid (${PAYMENT_STATUS_LABELS[state.paymentStatus]})`;
}

/** Works out which timeline entries a change should produce. */
function describeChanges(
  before: ProjectState,
  after: ProjectState,
  developerNames: { before: string | null; after: string | null },
): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  if (before.developerId !== after.developerId) {
    let description = "Developer unassigned";
    if (after.developerId) {
      description = developerNames.before
        ? `Developer changed from ${developerNames.before} to ${developerNames.after}`
        : `Assigned to ${developerNames.after}`;
    }
    entries.push({ action: "DEVELOPER_ASSIGNED", description });
  }

  if (before.status !== after.status) {
    const change = `Status changed from ${PROJECT_STATUS_LABELS[before.status]} to ${PROJECT_STATUS_LABELS[after.status]}`;
    entries.push(
      after.status === "COMPLETED"
        ? { action: "PROJECT_COMPLETED", description: "Project marked as completed" }
        : { action: "STATUS_CHANGED", description: change },
    );
  }

  if (before.clientPrice !== after.clientPrice) {
    entries.push({
      action: "PROJECT_UPDATED",
      description: `Client price changed from ${formatCurrency(before.clientPrice)} to ${formatCurrency(after.clientPrice)}`,
    });
  }
  if (before.developerCost !== after.developerCost) {
    entries.push({
      action: "PROJECT_UPDATED",
      description: `Developer cost changed from ${formatCurrency(before.developerCost)} to ${formatCurrency(after.developerCost)}`,
    });
  }
  if (before.advancePaid !== after.advancePaid || before.paymentStatus !== after.paymentStatus) {
    entries.push({ action: "PAYMENT_UPDATED", description: `Payment updated: ${paymentSummary(after)}` });
  }
  if (before.deadline.getTime() !== after.deadline.getTime()) {
    entries.push({
      action: "PROJECT_UPDATED",
      description: `Deadline changed to ${after.deadline.toISOString().slice(0, 10)}`,
    });
  }

  const detailsChanged =
    DETAIL_FIELDS.some((field) => before[field] !== after[field]) ||
    (before.startDate?.getTime() ?? null) !== (after.startDate?.getTime() ?? null);
  if (detailsChanged) {
    entries.push({ action: "PROJECT_UPDATED", description: "Project details updated" });
  }

  return entries;
}

async function buildWhere(query: ProjectQuery): Promise<Prisma.ProjectWhereInput> {
  const where: Prisma.ProjectWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.projectType) where.projectType = query.projectType;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
  if (query.developerId) where.developerId = query.developerId === "unassigned" ? null : query.developerId;

  if (query.deadline) {
    const start = today();
    if (query.deadline === "overdue") {
      where.deadline = { lt: start };
      where.status = query.status ?? { notIn: [...CLOSED_STATUSES] };
      if (query.status && CLOSED_STATUSES.includes(query.status)) where.id = { in: [] };
    } else {
      where.deadline = { gte: start, lte: addDays(start, query.deadline === "week" ? 7 : 30) };
      if (!query.status) where.status = { notIn: [...CLOSED_STATUSES] };
    }
  }

  if (query.q) {
    const contains = { contains: query.q, mode: "insensitive" } as const;
    const developers = await prisma.developer.findMany({ where: { name: contains }, select: { id: true } });
    where.OR = [
      { projectName: contains },
      { clientName: contains },
      { clientPhone: contains },
      { projectCode: contains },
      ...(developers.length > 0 ? [{ developerId: { in: developers.map((developer) => developer.id) } }] : []),
    ];
  }

  return where;
}

export async function listProjects(query: ProjectQuery = {}): Promise<ProjectDTO[]> {
  const projects = await prisma.project.findMany({
    where: await buildWhere(query),
    include: projectInclude,
    orderBy: { createdAt: "desc" },
  });
  return projects.map(toProjectDTO);
}

export async function getProject(id: string): Promise<ProjectDetailDTO | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { ...projectInclude, activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!project) return null;

  return {
    ...toProjectDTO(project),
    activities: project.activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      createdAt: activity.createdAt.toISOString(),
    })),
  };
}

export async function createProject(input: ProjectInput): Promise<ProjectDTO> {
  const developerName = await getDeveloperName(input.developerId);
  const state = withAssignedStatus(inputToState(input), false);

  const activities: ActivityEntry[] = [{ action: "PROJECT_CREATED", description: "Project created" }];
  if (developerName) {
    activities.push({ action: "DEVELOPER_ASSIGNED", description: `Assigned to ${developerName}` });
  }
  if (state.advancePaid > 0 || state.paymentStatus === "REFUNDED") {
    activities.push({ action: "PAYMENT_UPDATED", description: `Payment recorded: ${paymentSummary(state)}` });
  }
  if (state.status === "COMPLETED") {
    activities.push({ action: "PROJECT_COMPLETED", description: "Project marked as completed" });
  }

  const project = await prisma.project.create({
    data: {
      ...state,
      projectCode: await nextProjectCode(),
      activities: { create: activities },
    },
    include: projectInclude,
  });
  return toProjectDTO(project);
}

async function saveChanges(existing: ProjectWithDeveloper, requested: ProjectState): Promise<ProjectDTO> {
  const developerChanged = existing.developerId !== requested.developerId;
  const developerName = developerChanged
    ? await getDeveloperName(requested.developerId)
    : (existing.developer?.name ?? null);

  const next = withAssignedStatus(requested, Boolean(existing.developerId));
  const activities = describeChanges(recordToState(existing), next, {
    before: existing.developer?.name ?? null,
    after: developerName,
  });
  if (activities.length === 0) return toProjectDTO(existing);

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: { ...next, activities: { create: activities } },
    include: projectInclude,
  });
  return toProjectDTO(project);
}

async function findExisting(id: string): Promise<ProjectWithDeveloper> {
  const existing = await prisma.project.findUnique({ where: { id }, include: projectInclude });
  if (!existing) throw new ApiError(404, "Project not found.");
  return existing;
}

/** Full update from the edit form. */
export async function updateProject(id: string, input: ProjectInput): Promise<ProjectDTO> {
  const existing = await findExisting(id);
  return saveChanges(existing, inputToState(input));
}

/** Quick update of status, developer or payment. */
export async function patchProject(id: string, patch: ProjectPatch): Promise<ProjectDTO> {
  const existing = await findExisting(id);

  const advancePaid = patch.advancePaid ?? existing.advancePaid;
  if (advancePaid > existing.clientPrice) {
    throw new ApiError(422, "Please check the highlighted fields.", {
      advancePaid: `Paid amount cannot exceed the client price (${formatCurrency(existing.clientPrice)})`,
    });
  }

  // Recording a payment clears "Refunded" unless the request says otherwise.
  const paymentTouched = patch.advancePaid !== undefined || patch.refunded !== undefined;
  const refunded = patch.refunded ?? (patch.advancePaid === undefined && existing.paymentStatus === "REFUNDED");

  return saveChanges(existing, {
    ...recordToState(existing),
    status: patch.status ?? existing.status,
    developerId: patch.developerId === undefined ? existing.developerId : patch.developerId,
    advancePaid,
    paymentStatus: paymentTouched
      ? derivePaymentStatus(existing.clientPrice, advancePaid, refunded)
      : existing.paymentStatus,
  });
}

export async function deleteProject(id: string): Promise<void> {
  await findExisting(id);
  // Activities are removed with the project (onDelete: Cascade).
  await prisma.project.delete({ where: { id } });
}
