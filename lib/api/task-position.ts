import {
  isApiUser,
  parseIdParam,
  requireApiUser,
  serviceFailureToBody,
} from '@/lib/api/handler';
import { taskToDto } from '@/lib/api/mappers';
import { revalidateTaskCache } from '@/lib/api/revalidate';
import { jsonError, jsonOk } from '@/lib/api/responses';
import { moveTaskOnBoardForUser } from '@/lib/services/task-service';
import { MoveTaskOnBoardSchema } from '@/lib/validations/task';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) {
      return jsonError('Not found', 404);
    }

    const body = await request.json();
    const parsed = MoveTaskOnBoardSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        'Validation failed',
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const result = await moveTaskOnBoardForUser(taskId, parsed.data);
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status, failure.errors);
    }

    revalidateTaskCache();
    return jsonOk(taskToDto(result.data));
  } catch (error) {
    console.error('Error updating board order:', error);
    return jsonError('Failed to update board order', 500);
  }
}
