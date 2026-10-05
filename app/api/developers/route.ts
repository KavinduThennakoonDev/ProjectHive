import { jsonOk, readJson, withAuth } from "@/lib/api/http";
import { createDeveloper, listDevelopers } from "@/lib/services/developers";
import { developerInputSchema, developerQuerySchema } from "@/lib/validation/developer";

export const GET = withAuth(async (request) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = developerQuerySchema.parse(params);
  return jsonOk(await listDevelopers(query));
});

export const POST = withAuth(async (request) => {
  const input = developerInputSchema.parse(await readJson(request));
  return jsonOk(await createDeveloper(input), 201);
});
