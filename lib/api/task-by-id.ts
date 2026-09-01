import { canAccessTask } from '@/lib/api/tasks';
import {
  isApiUser,
  parseIdParam,
  requireApiUser,
  serviceFailureToBody,
} from '@/lib/api/handler';
import { taskToDto } from '@/lib/api/mappers';
import { revalidateTaskList } from '@/lib/api/revalidate';
import {
  jsonError,
  jsonMessage,
  jsonNotFound,
  jsonOk,
} from '@/lib/api/responses';
import { getTask } from '@/lib/dal';
import {
  deleteTaskForUser,
  updateTaskForUser,
} from '@/lib/services/task-service';
import { UpdateTaskSchema } from '@/lib/validations/task';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) return jsonNotFound();

    const allowed = await canAccessTask(userOrResponse, taskId);
    if (!allowed) return jsonNotFound();

    const task = await getTask(taskId);
    if (!task) return jsonNotFound();

    return jsonOk(taskToDto(task));
  } catch (error) {
    console.error('Error fetching task:', error);
    return jsonError('Failed to fetch task', 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) return jsonNotFound();

    const body = await request.json();
    const parsed = UpdateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        'Validation failed',
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const result = await updateTaskForUser(
      userOrResponse,
      taskId,
      parsed.data,
    );
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status, failure.errors);
    }

    revalidateTaskList();
    return jsonOk(taskToDto(result.data));
  } catch (error) {
    console.error('Error updating task:', error);
    return jsonError('Failed to update task', 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) return jsonNotFound();

    const result = await deleteTaskForUser(taskId);
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status);
    }

    revalidateTaskList();
    return jsonMessage('Task deleted successfully');
  } catch (error) {
    console.error('Error deleting task:', error);
    return jsonError('Failed to delete task', 500);
  }
}
