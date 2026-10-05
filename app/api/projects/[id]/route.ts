import { jsonOk, readId, readJson, withAuth } from "@/lib/api/http";
import { ApiError } from "@/lib/errors";
import { deleteProject, getProject, patchProject, updateProject } from "@/lib/services/projects";
import { projectInputSchema, projectPatchSchema } from "@/lib/validation/project";

type Context = RouteContext<"/api/projects/[id]">;

export const GET = withAuth<Context>(async (_request, context) => {
  const project = await getProject(await readId(context, "Project"));
  if (!project) throw new ApiError(404, "Project not found.");
  return jsonOk(project);
});

export const PUT = withAuth<Context>(async (request, context) => {
  const id = await readId(context, "Project");
  const input = projectInputSchema.parse(await readJson(request));
  return jsonOk(await updateProject(id, input));
});

export const PATCH = withAuth<Context>(async (request, context) => {
  const id = await readId(context, "Project");
  const patch = projectPatchSchema.parse(await readJson(request));
  return jsonOk(await patchProject(id, patch));
});

export const DELETE = withAuth<Context>(async (_request, context) => {
  await deleteProject(await readId(context, "Project"));
  return jsonOk({ deleted: true });
});
