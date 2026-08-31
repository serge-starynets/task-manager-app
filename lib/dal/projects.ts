import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_REVALIDATE_SECONDS } from '@/lib/dal/constants';
import { requireUser } from '@/lib/dal/users';

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
