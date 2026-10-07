import { db } from '@/db';
import { tasks, type Task, type User } from '@/db/schema';
import { and, asc, desc, eq, isNull, min, type SQL } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_REVALIDATE_SECONDS } from '@/lib/dal/constants';
import {
  DEFAULT_TASK_LIST_SORT,
  type TaskListSort,
} from '@/lib/task-list-sort';
import {
  PUBLIC_USER_COLUMNS,
  getCurrentUser,
  isAdmin,
  requireUser,
} from '@/lib/dal/users';

async function fetchTasks(userId: string, role: User['role']) {
  try {
    return await db.query.tasks.findMany({
      where: role === 'admin' ? undefined : eq(tasks.userId, userId),
      with: {
        user: { columns: PUBLIC_USER_COLUMNS },
      },
      orderBy: (tasksTable, { desc }) => [desc(tasksTable.createdAt)],
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

export async function getTasks(user: Pick<User, 'id' | 'role'>) {
  return unstable_cache(
    () => fetchTasks(user.id, user.role),
    ['tasks', user.id, user.role],
    { tags: ['tasks'], revalidate: CACHE_REVALIDATE_SECONDS },
  )();
}

function taskListOrderBy(sort: TaskListSort): SQL[] {
  const column = {
    type: tasks.type,
    title: tasks.title,
    status: tasks.status,
    priority: tasks.priority,
    createdAt: tasks.createdAt,
    updatedAt: tasks.updatedAt,
  }[sort.by];

  const primary = sort.dir === 'asc' ? asc(column) : desc(column);
  return [primary, desc(tasks.id)];
}

async function fetchTasksForProject(
  userId: string,
  projectId: number,
  sort: TaskListSort,
) {
  try {
    return await db.query.tasks.findMany({
      where: and(eq(tasks.userId, userId), eq(tasks.projectId, projectId)),
      with: {
        user: { columns: PUBLIC_USER_COLUMNS },
      },
      orderBy: taskListOrderBy(sort),
    });
  } catch (error) {
    console.error('Error fetching tasks for project:', error);
    throw new Error('Failed to fetch tasks for project');
  }
}

export async function getTasksForProject(
  userId: string,
  projectId: number,
  sort: TaskListSort = DEFAULT_TASK_LIST_SORT,
) {
  return unstable_cache(
    () => fetchTasksForProject(userId, projectId, sort),
    [
      'tasks',
      'project',
      userId,
      String(projectId),
      sort.by,
      sort.dir,
    ],
    { tags: ['tasks'], revalidate: CACHE_REVALIDATE_SECONDS },
  )();
}

async function fetchOrphanedTasks(userId: string, sort: TaskListSort) {
  try {
    return await db.query.tasks.findMany({
      where: and(eq(tasks.userId, userId), isNull(tasks.projectId)),
      with: {
        user: { columns: PUBLIC_USER_COLUMNS },
      },
      orderBy: taskListOrderBy(sort),
    });
  } catch (error) {
    console.error('Error fetching orphaned tasks:', error);
    throw new Error('Failed to fetch orphaned tasks');
  }
}

export async function getOrphanedTasks(
  userId: string,
  sort: TaskListSort = DEFAULT_TASK_LIST_SORT,
) {
  return unstable_cache(
    () => fetchOrphanedTasks(userId, sort),
    ['tasks', 'orphaned', userId, sort.by, sort.dir],
    { tags: ['tasks'], revalidate: CACHE_REVALIDATE_SECONDS },
  )();
}

export async function getTask(taskId: number) {
  try {
    const result = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: { user: { columns: PUBLIC_USER_COLUMNS } },
    });
    return result;
  } catch (err) {
    console.log('Error getting task:', taskId);
    return null;
  }
}

/** Returns the task if the current user owns it or is an admin; otherwise null. */
export async function getAccessibleTask(taskId: number) {
  const user = await requireUser();
  const task = await getTask(taskId);

  if (!task) return null;
  if (isAdmin(user) || task.userId === user.id) {
    return task;
  }

  return null;
}

export async function canManageTask(taskId: number) {
  const user = await getCurrentUser();
  if (!user) return false;

  const task = await getTask(taskId);
  if (!task) return false;

  return isAdmin(user) || task.userId === user.id;
}

function projectMatch(projectId: number | null) {
  return projectId === null ? isNull(tasks.projectId) : eq(tasks.projectId, projectId);
}

/** Next `boardOrder` so a ticket appears at the top of its Board column. */
export async function nextTopBoardOrder(
  userId: string,
  projectId: number | null,
  status: Task['status'],
): Promise<number> {
  const [row] = await db
    .select({ top: min(tasks.boardOrder) })
    .from(tasks)
    .where(
      and(eq(tasks.userId, userId), projectMatch(projectId), eq(tasks.status, status)),
    );

  if (row?.top == null) return 0;
  return row.top - 1;
}

export async function listTaskIdsInColumn(
  userId: string,
  projectId: number | null,
  status: Task['status'],
): Promise<number[]> {
  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(eq(tasks.userId, userId), projectMatch(projectId), eq(tasks.status, status)),
    )
    .orderBy(asc(tasks.boardOrder), desc(tasks.createdAt), desc(tasks.id));

  return rows.map((row) => row.id);
}
