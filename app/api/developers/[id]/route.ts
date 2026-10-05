import { jsonOk, readId, readJson, withAuth } from "@/lib/api/http";
import { ApiError } from "@/lib/errors";
import { deleteDeveloper, getDeveloper, updateDeveloper } from "@/lib/services/developers";
import { developerInputSchema } from "@/lib/validation/developer";

type Context = RouteContext<"/api/developers/[id]">;

export const GET = withAuth<Context>(async (_request, context) => {
  const developer = await getDeveloper(await readId(context, "Developer"));
  if (!developer) throw new ApiError(404, "Developer not found.");
  return jsonOk(developer);
});

export const PUT = withAuth<Context>(async (request, context) => {
  const id = await readId(context, "Developer");
  const input = developerInputSchema.parse(await readJson(request));
  return jsonOk(await updateDeveloper(id, input));
});

export const DELETE = withAuth<Context>(async (_request, context) => {
  await deleteDeveloper(await readId(context, "Developer"));
  return jsonOk({ deleted: true });
});
