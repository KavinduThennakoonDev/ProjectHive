import { z } from "zod";
import { requiredEmail, requiredText } from "@/lib/validation/common";

export const loginSchema = z.object({
  email: requiredEmail,
  password: z.string({ error: "Password is required" }).min(1, "Password is required").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  name: requiredText("Name", 100),
  email: requiredEmail,
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string({ error: "Current password is required" }).min(1, "Current password is required"),
    newPassword: z
      .string({ error: "New password is required" })
      .min(8, "New password must be at least 8 characters")
      .max(200, "New password is too long"),
    confirmPassword: z.string({ error: "Please confirm the new password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current one",
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
