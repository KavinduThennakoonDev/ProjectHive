import { jsonOk, readJson, withAuth } from "@/lib/api/http";
import { createProject, listProjects } from "@/lib/services/projects";
import { projectInputSchema, projectQuerySchema } from "@/lib/validation/project";

export const GET = withAuth(async (request) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = projectQuerySchema.parse(params);
  return jsonOk(await listProjects(query));
});

export const POST = withAuth(async (request) => {
  const input = projectInputSchema.parse(await readJson(request));
  return jsonOk(await createProject(input), 201);
});
