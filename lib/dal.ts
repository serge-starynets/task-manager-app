import { db } from '@/db';
import { getSession } from './auth';
import { and, eq, ilike, inArray, isNull, notInArray, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import {
  tasks,
  projects,
  users,
  taskRelations,
  User,
  Task,
  RelatedTaskSummary,
} from '@/db/schema';

const CACHE_REVALIDATE_SECONDS = 30;

export function isAdmin(user: Pick<User, 'role'>) {
  return user.role === 'admin';
}

// Current user
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    return result[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }
  return user;
}

// Get user by email
export const getUserByEmail = async (email: string) => {
  try {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

async function fetchProjects(userId: string) {
  try {
    return await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: (projectsTable, { asc }) => [asc(projectsTable.createdAt)],
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

export async function getProjects(userId: string) {
  return unstable_cache(() => fetchProjects(userId), ['projects', userId], {
    tags: ['projects'],
    revalidate: CACHE_REVALIDATE_SECONDS,
  })();
}

export async function getProject(projectId: number) {
  try {
    const result = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });
    return result ?? null;
  } catch (error) {
    console.error('Error fetching project:', projectId, error);
    return null;
  }
}

/** Returns the project if the current user owns it; otherwise null. */
export async function getAccessibleProject(projectId: number) {
  const user = await requireUser();
  const project = await getProject(projectId);

  if (!project) return null;
  if (project.userId === user.id) {
    return project;
  }

  return null;
}

export async function countUserProjects(userId: string) {
  try {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));
    return result.length;
  } catch (error) {
    console.error('Error counting projects:', error);
    throw new Error('Failed to count projects');
  }
}

async function fetchTasks(userId: string, role: User['role']) {
  try {
    return await db.query.tasks.findMany({
      where: role === 'admin' ? undefined : eq(tasks.userId, userId),
      with: {
        user: true,
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
        user: true,
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
        user: true,
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
      with: { user: true },
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

/** Ordered pair for undirected relations: always taskIdA < taskIdB. */
export function orderedTaskPair(id1: number, id2: number): [number, number] {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

/** Same project, or both orphaned. Self-links are never eligible. */
export function areTasksRelatable(
  a: Pick<Task, 'id' | 'projectId'>,
  b: Pick<Task, 'id' | 'projectId'>,
): boolean {
  if (a.id === b.id) return false;
  if (a.projectId === null && b.projectId === null) return true;
  if (a.projectId !== null && a.projectId === b.projectId) return true;
  return false;
}

async function fetchRelatedTaskIds(taskId: number): Promise<number[]> {
  const rows = await db
    .select({
      taskIdA: taskRelations.taskIdA,
      taskIdB: taskRelations.taskIdB,
    })
    .from(taskRelations)
    .where(
      or(eq(taskRelations.taskIdA, taskId), eq(taskRelations.taskIdB, taskId)),
    );

  return rows.map((row) =>
    row.taskIdA === taskId ? row.taskIdB : row.taskIdA,
  );
}

export async function getRelatedTasks(
  taskId: number,
): Promise<RelatedTaskSummary[]> {
  try {
    const relatedIds = await fetchRelatedTaskIds(taskId);
    if (relatedIds.length === 0) return [];

    return await db
      .select({
        id: tasks.id,
        taskId: tasks.taskId,
        title: tasks.title,
      })
      .from(tasks)
      .where(inArray(tasks.id, relatedIds))
      .orderBy(tasks.taskId);
  } catch (error) {
    console.error('Error fetching related tasks:', taskId, error);
    return [];
  }
}

export async function searchRelatableTasks(
  sourceTaskId: number,
  query: string,
): Promise<RelatedTaskSummary[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const canManage = await canManageTask(sourceTaskId);
  if (!canManage) return [];

  const source = await getTask(sourceTaskId);
  if (!source) return [];

  const relatedIds = await fetchRelatedTaskIds(sourceTaskId);
  const excludeIds =
    relatedIds.length > 0 ? [sourceTaskId, ...relatedIds] : [sourceTaskId];

  const pattern = `%${trimmed}%`;
  const eligibility =
    source.projectId === null
      ? isNull(tasks.projectId)
      : eq(tasks.projectId, source.projectId);

  try {
    return await db
      .select({
        id: tasks.id,
        taskId: tasks.taskId,
        title: tasks.title,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, source.userId),
          eligibility,
          notInArray(tasks.id, excludeIds),
          or(ilike(tasks.title, pattern), ilike(tasks.taskId, pattern)),
        ),
      )
      .orderBy(tasks.taskId)
      .limit(10);
  } catch (error) {
    console.error('Error searching relatable tasks:', error);
    return [];
  }
}
