import { jsonOk, readJson, withAuth } from "@/lib/api/http";
import { createSession } from "@/lib/auth/session";
import { changePassword } from "@/lib/services/admin";
import { passwordChangeSchema } from "@/lib/validation/auth";

export const PUT = withAuth(async (request, _context, admin) => {
  const input = passwordChangeSchema.parse(await readJson(request));
  const sessionVersion = await changePassword(admin.id, input);
  // Other sessions are now invalid; keep this browser logged in.
  await createSession({ adminId: admin.id, sessionVersion });
  return jsonOk({ updated: true });
});
