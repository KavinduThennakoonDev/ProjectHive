import type {
  ActivityAction,
  DeveloperStatus,
  PaymentStatus,
  Priority,
  ProjectStatus,
  ProjectType,
} from "@/lib/constants";

// Shapes returned by the API and passed to components. Dates are ISO strings.

export interface AdminDTO {
  id: string;
  name: string;
  email: string;
}

export interface DeveloperSummary {
  id: string;
  name: string;
  status: DeveloperStatus;
}

export interface ProjectDTO {
  id: string;
  projectCode: string;
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
  developer: DeveloperSummary | null;
  startDate: string | null;
  deadline: string;
  priority: Priority;
  status: ProjectStatus;
  developerCost: number;
  clientPrice: number;
  advancePaid: number;
  paymentStatus: PaymentStatus;
  profit: number;
  profitPercent: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectActivityDTO {
  id: string;
  action: ActivityAction;
  description: string;
  createdAt: string;
}

export interface ProjectDetailDTO extends ProjectDTO {
  activities: ProjectActivityDTO[];
}

export interface DeveloperStats {
  assignedProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalDeveloperCost: number;
}

export interface DeveloperDTO {
  id: string;
  name: string;
  phone: string;
  email: string;
  skills: string[];
  notes: string;
  status: DeveloperStatus;
  createdAt: string;
  updatedAt: string;
  stats: DeveloperStats;
}

export interface DeveloperDetailDTO extends DeveloperDTO {
  projects: ProjectDTO[];
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  overdueProjects: number;
  totalRevenue: number;
  totalDeveloperCost: number;
  totalProfit: number;
  profitMargin: number;
}

export interface DashboardDTO {
  stats: DashboardStats;
  recentProjects: ProjectDTO[];
  upcomingDeadlines: ProjectDTO[];
  overdueProjects: ProjectDTO[];
}
