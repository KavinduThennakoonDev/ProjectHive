import { jsonError, jsonOk, readJson, withErrorHandling } from "@/lib/api/http";
import { clearAttempts, getRetryAfterSeconds, recordFailedAttempt } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { authenticate } from "@/lib/services/admin";
import { loginSchema } from "@/lib/validation/auth";

export const POST = withErrorHandling(async (request) => {
  const input = loginSchema.parse(await readJson(request));

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limitKey = `${clientIp}:${input.email}`;
  const retryAfter = getRetryAfterSeconds(limitKey);
  if (retryAfter > 0) {
    const minutes = Math.ceil(retryAfter / 60);
    return jsonError(429, `Too many login attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  const admin = await authenticate(input);
  if (!admin) {
    recordFailedAttempt(limitKey);
    return jsonError(401, "Invalid email or password.");
  }

  clearAttempts(limitKey);
  await createSession({ adminId: admin.id, sessionVersion: admin.sessionVersion });
  return jsonOk({ admin: { id: admin.id, name: admin.name, email: admin.email } });
});
