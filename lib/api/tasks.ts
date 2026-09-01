import {
  getCurrentUser,
  getTasks,
  getTasksForProject,
  getTask,
  isAdmin,
} from '@/lib/dal';
import {
  isApiUser,
  parseOptionalProjectId,
  requireApiUser,
  serviceFailureToBody,
} from '@/lib/api/handler';
import { taskToDto } from '@/lib/api/mappers';
import { revalidateTaskList } from '@/lib/api/revalidate';
import {
  jsonCreated,
  jsonError,
  jsonOk,
} from '@/lib/api/responses';
import { createTaskForUser } from '@/lib/services/task-service';
import { CreateTaskSchema, TaskStatusSchema } from '@/lib/validations/task';

export async function GET(request: Request) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;
    const user = userOrResponse;

    const { searchParams } = new URL(request.url);
    const projectIdParam = parseOptionalProjectId(searchParams.get('projectId'));
    if (projectIdParam === 'invalid') {
      return jsonError('Invalid projectId', 400);
    }

    const statusParam = searchParams.get('status');
    if (statusParam) {
      const statusResult = TaskStatusSchema.safeParse(statusParam);
      if (!statusResult.success) {
        return jsonError('Invalid status', 400);
      }
    }

    let tasks;
    if (projectIdParam !== null) {
      tasks = await getTasksForProject(user.id, projectIdParam);
    } else {
      tasks = await getTasks(user);
    }

    if (statusParam) {
      tasks = tasks.filter((task) => task.status === statusParam);
    }

    return jsonOk(tasks.map(taskToDto));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return jsonError('Failed to fetch tasks', 500);
  }
}

export async function POST(request: Request) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;
    const user = userOrResponse;

    const body = await request.json();
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        'Validation failed',
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const result = await createTaskForUser(user, parsed.data);
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status, failure.errors);
    }

    revalidateTaskList();
    return jsonCreated(taskToDto(result.data));
  } catch (error) {
    console.error('Error creating task:', error);
    return jsonError('Failed to create task', 500);
  }
}

export async function canAccessTask(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  taskId: number,
) {
  if (!user) return false;
  const task = await getTask(taskId);
  if (!task) return false;
  return isAdmin(user) || task.userId === user.id;
}
