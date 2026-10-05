import { ACTIVE_STATUSES, CLOSED_STATUSES, PENDING_STATUSES, UPCOMING_DEADLINE_DAYS } from "@/lib/constants";
import { daysUntil } from "@/lib/dates";
import { roundMoney } from "@/lib/finance";
import { listProjects } from "@/lib/services/projects";
import type { DashboardDTO, ProjectDTO } from "@/lib/types";

const RECENT_PROJECT_COUNT = 6;

const byDeadline = (a: ProjectDTO, b: ProjectDTO) => a.deadline.localeCompare(b.deadline);

/**
 * Builds every dashboard number from the projects in the database.
 * Cancelled projects are counted in "Total Projects" but left out of
 * revenue, developer cost and profit.
 */
export async function getDashboard(): Promise<DashboardDTO> {
  const projects = await listProjects();

  const open = projects.filter((project) => !CLOSED_STATUSES.includes(project.status));
  const overdue = open.filter((project) => daysUntil(project.deadline) < 0).sort(byDeadline);
  const upcoming = open
    .filter((project) => {
      const days = daysUntil(project.deadline);
      return days >= 0 && days <= UPCOMING_DEADLINE_DAYS;
    })
    .sort(byDeadline);

  const billable = projects.filter((project) => project.status !== "CANCELLED");
  const sum = (pick: (project: ProjectDTO) => number) =>
    roundMoney(billable.reduce((total, project) => total + pick(project), 0));

  const totalRevenue = sum((project) => project.clientPrice);
  const totalDeveloperCost = sum((project) => project.developerCost);
  const totalProfit = roundMoney(totalRevenue - totalDeveloperCost);

  return {
    stats: {
      totalProjects: projects.length,
      activeProjects: projects.filter((project) => ACTIVE_STATUSES.includes(project.status)).length,
      completedProjects: projects.filter((project) => project.status === "COMPLETED").length,
      pendingProjects: projects.filter((project) => PENDING_STATUSES.includes(project.status)).length,
      overdueProjects: overdue.length,
      totalRevenue,
      totalDeveloperCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? roundMoney((totalProfit / totalRevenue) * 100) : 0,
    },
    recentProjects: projects.slice(0, RECENT_PROJECT_COUNT),
    upcomingDeadlines: upcoming,
    overdueProjects: overdue,
  };
}
