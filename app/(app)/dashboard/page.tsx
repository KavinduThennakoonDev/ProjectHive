import type { Metadata } from "next";
import Link from "next/link";
import {
  Banknote,
  CalendarCheck,
  CircleCheck,
  FolderKanban,
  Hourglass,
  Plus,
  TrendingUp,
  TriangleAlert,
  Wallet,
  Zap,
} from "lucide-react";
import { DeadlineList } from "@/components/dashboard/deadline-list";
import { ProjectSummaryTable } from "@/components/projects/project-summary-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { UPCOMING_DEADLINE_DAYS } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getDashboard } from "@/lib/services/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const { stats, recentProjects, upcomingDeadlines, overdueProjects } = await getDashboard();

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${admin.name}. Here is how ProjectHive is doing.`} />

      <div className="space-y-6">
        <section aria-label="Project counts" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Projects" value={stats.totalProjects} icon={FolderKanban} tone="blue" />
          <StatCard label="Active Projects" value={stats.activeProjects} icon={Zap} tone="blue" hint="Assigned and in progress" />
          <StatCard label="Completed Projects" value={stats.completedProjects} icon={CircleCheck} tone="green" />
          <StatCard label="Pending Projects" value={stats.pendingProjects} icon={Hourglass} tone="amber" hint="New, not started yet" />
          <StatCard
            label="Overdue Projects"
            value={stats.overdueProjects}
            icon={TriangleAlert}
            tone={stats.overdueProjects > 0 ? "red" : "default"}
            highlight={stats.overdueProjects > 0}
            hint={stats.overdueProjects > 0 ? "Need attention" : "Nothing overdue"}
            className="col-span-2 md:col-span-1"
          />
        </section>

        <section aria-label="Money" className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={Banknote}
            hint="Client prices, excluding cancelled projects"
          />
          <StatCard
            label="Total Developer Cost"
            value={formatCurrency(stats.totalDeveloperCost)}
            icon={Wallet}
            hint="What developers charge ProjectHive"
          />
          <StatCard
            label="Total Profit"
            value={formatCurrency(stats.totalProfit)}
            icon={TrendingUp}
            tone="green"
            hint={`Revenue − Developer Cost · ${formatPercent(stats.profitMargin)} margin`}
            className="border-emerald-200 bg-emerald-50/50"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <DeadlineList
            title="Overdue Projects"
            description="The deadline has passed and the project is not completed."
            projects={overdueProjects}
            emptyIcon={CircleCheck}
            emptyTitle="No overdue projects"
            urgent
          />
          <DeadlineList
            title="Upcoming Deadlines"
            description={`Due within the next ${UPCOMING_DEADLINE_DAYS} days.`}
            projects={upcomingDeadlines}
            emptyIcon={CalendarCheck}
            emptyTitle="No deadlines this week"
          />
        </div>

        <Card className="gap-0 pb-0">
          <CardHeader className="border-b">
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>The latest projects, with profit for each one.</CardDescription>
            <CardAction>
              <Button asChild variant="outline">
                <Link href="/projects">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          {recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to see it here."
              action={
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus />
                    New Project
                  </Link>
                </Button>
              }
            />
          ) : (
            <ProjectSummaryTable projects={recentProjects} />
          )}
        </Card>
      </div>
    </>
  );
}
