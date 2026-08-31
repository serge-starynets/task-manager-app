import { db } from '@/db';
import { tasks, type User } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_REVALIDATE_SECONDS } from '@/lib/dal/constants';
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

async function fetchTasksForProject(userId: string, projectId: number) {
  try {
    return await db.query.tasks.findMany({
      where: and(eq(tasks.userId, userId), eq(tasks.projectId, projectId)),
      with: {
        user: { columns: PUBLIC_USER_COLUMNS },
      },
      orderBy: (tasksTable, { desc }) => [desc(tasksTable.updatedAt)],
    });
  } catch (error) {
    console.error('Error fetching tasks for project:', error);
    throw new Error('Failed to fetch tasks for project');
  }
}

export async function getTasksForProject(userId: string, projectId: number) {
  return unstable_cache(
    () => fetchTasksForProject(userId, projectId),
    ['tasks', 'project', userId, String(projectId)],
    { tags: ['tasks'], revalidate: CACHE_REVALIDATE_SECONDS },
  )();
}

async function fetchOrphanedTasks(userId: string) {
  try {
    return await db.query.tasks.findMany({
      where: and(eq(tasks.userId, userId), isNull(tasks.projectId)),
      with: {
        user: { columns: PUBLIC_USER_COLUMNS },
      },
      orderBy: (tasksTable, { desc }) => [desc(tasksTable.updatedAt)],
    });
  } catch (error) {
    console.error('Error fetching orphaned tasks:', error);
    throw new Error('Failed to fetch orphaned tasks');
  }
}

export async function getOrphanedTasks(userId: string) {
  return unstable_cache(
    () => fetchOrphanedTasks(userId),
    ['tasks', 'orphaned', userId],
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
