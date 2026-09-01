import {
  isApiUser,
  requireApiUser,
  serviceFailureToBody,
} from '@/lib/api/handler';
import { projectToDto } from '@/lib/api/mappers';
import { revalidateProjectViews } from '@/lib/api/revalidate';
import { jsonCreated, jsonError, jsonOk } from '@/lib/api/responses';
import { getProjects } from '@/lib/dal';
import { createProjectForUser } from '@/lib/services/project-service';
import { ProjectSchema } from '@/lib/validations/project';

export async function GET() {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const projects = await getProjects(userOrResponse.id);
    return jsonOk(projects.map(projectToDto));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return jsonError('Failed to fetch projects', 500);
  }
}

export async function POST(request: Request) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const body = await request.json();
    const parsed = ProjectSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        'Validation failed',
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const result = await createProjectForUser(userOrResponse, parsed.data);
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status, failure.errors);
    }

    revalidateProjectViews();
    return jsonCreated(projectToDto(result.data));
  } catch (error) {
    console.error('Error creating project:', error);
    return jsonError('Failed to create project', 500);
  }
}
