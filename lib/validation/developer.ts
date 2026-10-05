import { z } from "zod";
import { DEVELOPER_STATUSES } from "@/lib/constants";
import { optionalEmail, optionalPhone, optionalText, requiredText } from "@/lib/validation/common";

export const developerInputSchema = z.object({
  name: requiredText("Name", 100),
  phone: optionalPhone,
  email: optionalEmail,
  skills: z
    .array(z.string().trim().min(1).max(40, "Each skill must be 40 characters or fewer"), {
      error: "Skills must be a list",
    })
    .max(30, "Add up to 30 skills")
    .default([]),
  notes: optionalText("Notes", 2000),
  status: z.enum(DEVELOPER_STATUSES, { error: "Select a status" }).default("ACTIVE"),
});
export type DeveloperInput = z.infer<typeof developerInputSchema>;

export const developerQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(DEVELOPER_STATUSES).optional(),
});
export type DeveloperQuery = z.infer<typeof developerQuerySchema>;
