import { z } from "zod";

export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const PHONE_PATTERN = /^\+?[\d\s\-()]{7,20}$/;

export function isObjectId(value: string): boolean {
  return OBJECT_ID_PATTERN.test(value);
}

export const optionalText = (label: string, max: number) =>
  z
    .string({ error: `${label} must be text` })
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .default("");

export const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const optionalPhone = z
  .string({ error: "Enter a valid phone number" })
  .trim()
  .refine((value) => value === "" || PHONE_PATTERN.test(value), "Enter a valid phone number")
  .default("");

export const optionalEmail = z
  .string({ error: "Enter a valid email address" })
  .trim()
  .toLowerCase()
  .max(200, "Email must be 200 characters or fewer")
  .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address")
  .default("");

export const requiredEmail = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(200, "Email must be 200 characters or fewer")
  .refine((value) => z.email().safeParse(value).success, "Enter a valid email address");

/** Turns a ZodError into `{ fieldName: "first message" }` for forms. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
