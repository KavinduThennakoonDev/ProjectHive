// Shared option lists and labels. Values mirror the enums in prisma/schema.prisma
// but live here so client components never import the Prisma client.

export const APP_NAME = "ProjectHive";
export const APP_TIME_ZONE = "Asia/Colombo";
export const UPCOMING_DEADLINE_DAYS = 7;

export const PROJECT_TYPES = [
  "ASSIGNMENT",
  "RESEARCH",
  "FINAL_YEAR_PROJECT",
  "SOFTWARE_PROJECT",
  "WEB_DEVELOPMENT",
  "MOBILE_APPLICATION",
  "MACHINE_LEARNING",
  "DATA_SCIENCE",
  "OTHER",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  ASSIGNMENT: "Assignment",
  RESEARCH: "Research",
  FINAL_YEAR_PROJECT: "Final Year Project",
  SOFTWARE_PROJECT: "Software Project",
  WEB_DEVELOPMENT: "Web Development",
  MOBILE_APPLICATION: "Mobile Application",
  MACHINE_LEARNING: "Machine Learning",
  DATA_SCIENCE: "Data Science",
  OTHER: "Other",
};

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PROJECT_STATUSES = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "CLIENT_REVIEW",
  "REVISION",
  "COMPLETED",
  "CANCELLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  CLIENT_REVIEW: "Client Review",
  REVISION: "Revision",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** Statuses that no longer need work, so deadlines stop mattering. */
export const CLOSED_STATUSES: readonly ProjectStatus[] = ["COMPLETED", "CANCELLED"];
/** "Pending" on the dashboard: created but not yet picked up. */
export const PENDING_STATUSES: readonly ProjectStatus[] = ["NEW"];
/** "Active" on the dashboard: assigned and still being worked on. */
export const ACTIVE_STATUSES: readonly ProjectStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "CLIENT_REVIEW",
  "REVISION",
];

export const PAYMENT_STATUSES = ["PENDING", "PARTIALLY_PAID", "FULLY_PAID", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially Paid",
  FULLY_PAID: "Fully Paid",
  REFUNDED: "Refunded",
};

export const DEVELOPER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type DeveloperStatus = (typeof DEVELOPER_STATUSES)[number];

export const DEVELOPER_STATUS_LABELS: Record<DeveloperStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const ACTIVITY_ACTIONS = [
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "DEVELOPER_ASSIGNED",
  "STATUS_CHANGED",
  "PAYMENT_UPDATED",
  "PROJECT_COMPLETED",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  PROJECT_CREATED: "Project Created",
  PROJECT_UPDATED: "Project Updated",
  DEVELOPER_ASSIGNED: "Developer Assigned",
  STATUS_CHANGED: "Status Changed",
  PAYMENT_UPDATED: "Payment Updated",
  PROJECT_COMPLETED: "Project Completed",
};

export const DEADLINE_FILTERS = ["overdue", "week", "month"] as const;
export type DeadlineFilter = (typeof DEADLINE_FILTERS)[number];

export const DEADLINE_FILTER_LABELS: Record<DeadlineFilter, string> = {
  overdue: "Overdue",
  week: "Due in 7 days",
  month: "Due in 30 days",
};
