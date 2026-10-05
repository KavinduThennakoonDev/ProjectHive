import { ApiError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import type { AdminDTO } from "@/lib/types";
import type { LoginInput, PasswordChangeInput, ProfileInput } from "@/lib/validation/auth";

// Compared against when the email is unknown, so both cases take the same time.
const DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8lJ0p8nQ0nV0wq7uZq0k5rQeR6vF1a";

export interface AuthenticatedAdmin extends AdminDTO {
  sessionVersion: number;
}

/** Returns the admin when the email and password match, otherwise null. */
export async function authenticate({ email, password }: LoginInput): Promise<AuthenticatedAdmin | null> {
  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid = await verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid) return null;
  return { id: admin.id, name: admin.name, email: admin.email, sessionVersion: admin.sessionVersion };
}

export async function updateProfile(adminId: string, input: ProfileInput): Promise<AdminDTO> {
  const taken = await prisma.admin.findFirst({
    where: { email: input.email, NOT: { id: adminId } },
    select: { id: true },
  });
  if (taken) {
    throw new ApiError(422, "Please check the highlighted fields.", {
      email: "Another admin already uses this email",
    });
  }
  return prisma.admin.update({
    where: { id: adminId },
    data: input,
    select: { id: true, name: true, email: true },
  });
}

/** Changes the password and signs out every other session. Returns the new session version. */
export async function changePassword(adminId: string, input: PasswordChangeInput): Promise<number> {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new ApiError(404, "Admin not found.");

  if (!(await verifyPassword(input.currentPassword, admin.passwordHash))) {
    throw new ApiError(422, "Please check the highlighted fields.", {
      currentPassword: "Current password is incorrect",
    });
  }

  const updated = await prisma.admin.update({
    where: { id: adminId },
    data: { passwordHash: await hashPassword(input.newPassword), sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  return updated.sessionVersion;
}
