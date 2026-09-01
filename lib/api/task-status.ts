import {
  isApiUser,
  parseIdParam,
  requireApiUser,
  serviceFailureToBody,
} from '@/lib/api/handler';
import { taskToDto } from '@/lib/api/mappers';
import { revalidateTaskList } from '@/lib/api/revalidate';
import { jsonError, jsonOk } from '@/lib/api/responses';
import { updateTaskStatusForUser } from '@/lib/services/task-service';
import { TaskStatusSchema } from '@/lib/validations/task';

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
    const parsed = TaskStatusSchema.safeParse(body.status);
    if (!parsed.success) {
      return jsonError('Validation failed', 400, {
        status: ['Please select a valid status'],
      });
    }

    const result = await updateTaskStatusForUser(taskId, parsed.data);
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status, failure.errors);
    }

    revalidateTaskList();
    return jsonOk(taskToDto(result.data));
  } catch (error) {
    console.error('Error updating task status:', error);
    return jsonError('Failed to update task status', 500);
  }
}
