import {
  isApiUser,
  parseIdParam,
  requireApiUser,
  serviceFailureToBody,
} from '@/lib/api/handler';
import { projectToDto } from '@/lib/api/mappers';
import { revalidateProjectViews } from '@/lib/api/revalidate';
import {
  jsonError,
  jsonNotFound,
  jsonOk,
} from '@/lib/api/responses';
import { getProject } from '@/lib/dal';
import { updateProjectForUser } from '@/lib/services/project-service';
import { UpdateProjectSchema } from '@/lib/validations/project';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const projectId = parseIdParam(id);
    if (projectId === null) return jsonNotFound();

    const project = await getProject(projectId);
    if (!project || project.userId !== userOrResponse.id) {
      return jsonNotFound();
    }

    return jsonOk(projectToDto(project));
  } catch (error) {
    console.error('Error fetching project:', error);
    return jsonError('Failed to fetch project', 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const projectId = parseIdParam(id);
    if (projectId === null) return jsonNotFound();

    const body = await request.json();
    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        'Validation failed',
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const result = await updateProjectForUser(
      userOrResponse,
      projectId,
      parsed.data,
    );
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status, failure.errors);
    }

    revalidateProjectViews();
    return jsonOk(projectToDto(result.data));
  } catch (error) {
    console.error('Error updating project:', error);
    return jsonError('Failed to update project', 500);
  }
}
