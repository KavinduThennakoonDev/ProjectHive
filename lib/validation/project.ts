import { z } from "zod";
import {
  DEADLINE_FILTERS,
  PAYMENT_STATUSES,
  PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from "@/lib/constants";
import { isValidDateOnly } from "@/lib/dates";
import { roundMoney } from "@/lib/finance";
import {
  OBJECT_ID_PATTERN,
  optionalEmail,
  optionalPhone,
  optionalText,
  requiredText,
} from "@/lib/validation/common";

const MAX_AMOUNT = 1_000_000_000;

const money = (label: string) =>
  z
    .number({
      error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be a valid amount`),
    })
    .min(0, `${label} cannot be negative`)
    .max(MAX_AMOUNT, `${label} is too large`)
    .transform(roundMoney);

const dateOnly = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .min(1, `${label} is required`)
    .refine(isValidDateOnly, `${label} is not a valid date`);

const developerId = z
  .string({ error: "Select a valid developer" })
  .regex(OBJECT_ID_PATTERN, "Select a valid developer")
  .nullable();

const projectFields = z.object({
  projectName: requiredText("Project name", 150),
  projectType: z.enum(PROJECT_TYPES, { error: "Select a project type" }),
  clientName: requiredText("Client name", 100),
  clientPhone: optionalPhone,
  clientEmail: optionalEmail,
  description: optionalText("Description", 5000),
  subject: optionalText("Subject / course", 200),
  requirements: optionalText("Requirements", 5000),
  technologies: optionalText("Technology / tools", 500),
  referenceMaterials: optionalText("Reference materials", 2000),
  developerId: developerId.default(null),
  startDate: z
    .string()
    .refine((value) => value === "" || isValidDateOnly(value), "Start date is not a valid date")
    .nullable()
    .default(null)
    .transform((value) => value || null),
  deadline: dateOnly("Deadline"),
  priority: z.enum(PRIORITIES, { error: "Select a priority" }).default("MEDIUM"),
  status: z.enum(PROJECT_STATUSES, { error: "Select a status" }).default("NEW"),
  developerCost: money("Developer cost"),
  clientPrice: money("Client price"),
  advancePaid: money("Advance paid").default(0),
  refunded: z.boolean({ error: "Refunded must be true or false" }).default(false),
});

/** Body of POST /api/projects and PUT /api/projects/[id]. */
export const projectInputSchema = projectFields
  .refine((data) => data.advancePaid <= data.clientPrice, {
    path: ["advancePaid"],
    message: "Advance cannot exceed the client price",
  })
  .refine((data) => !data.startDate || data.deadline >= data.startDate, {
    path: ["deadline"],
    message: "Deadline cannot be before the start date",
  });
export type ProjectInput = z.infer<typeof projectInputSchema>;

/** Body of PATCH /api/projects/[id]: quick updates from the list and details page. */
export const projectPatchSchema = z
  .object({
    status: z.enum(PROJECT_STATUSES, { error: "Select a status" }),
    developerId,
    advancePaid: money("Paid amount"),
    refunded: z.boolean({ error: "Refunded must be true or false" }),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update" });
export type ProjectPatch = z.infer<typeof projectPatchSchema>;

/** Query string of GET /api/projects. */
export const projectQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  projectType: z.enum(PROJECT_TYPES).optional(),
  developerId: z.union([z.string().regex(OBJECT_ID_PATTERN), z.literal("unassigned")]).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  deadline: z.enum(DEADLINE_FILTERS).optional(),
});
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
