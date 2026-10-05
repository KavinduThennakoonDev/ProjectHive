import { jsonOk, readJson, withAuth } from "@/lib/api/http";
import { updateProfile } from "@/lib/services/admin";
import { profileSchema } from "@/lib/validation/auth";

export const PUT = withAuth(async (request, _context, admin) => {
  const input = profileSchema.parse(await readJson(request));
  return jsonOk({ admin: await updateProfile(admin.id, input) });
});
