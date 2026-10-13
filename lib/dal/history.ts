import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { entityHistory, type EntityHistory } from '@/db/schema';
import { getAccessibleProject } from '@/lib/dal/projects';
import { getAccessibleTask } from '@/lib/dal/tasks';
import type { HistoryEntityType } from '@/lib/entity-history';

export type EntityHistoryWithUser = EntityHistory & {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    username: string | null;
    customImage: string | null;
    preferCustomProfile: boolean;
    role: 'admin' | 'user';
  };
};

const HISTORY_USER_COLUMNS = {
  id: true,
  email: true,
  name: true,
  image: true,
  username: true,
  customImage: true,
  preferCustomProfile: true,
  role: true,
} as const;

async function queryEntityHistory(
  entityType: HistoryEntityType,
  entityId: number,
): Promise<EntityHistoryWithUser[]> {
  try {
    return await db.query.entityHistory.findMany({
      where: and(
        eq(entityHistory.entityType, entityType),
        eq(entityHistory.entityId, entityId),
      ),
      with: {
        user: { columns: HISTORY_USER_COLUMNS },
      },
      orderBy: (rows, { desc }) => [desc(rows.createdAt), desc(rows.id)],
    });
  } catch (error) {
    console.error('Error fetching entity history:', entityType, entityId, error);
    return [];
  }
}

/** Requires the caller to already hold access; prefer getTaskHistory / getProjectHistory. */
export async function getEntityHistory(
  entityType: HistoryEntityType,
  entityId: number,
): Promise<EntityHistoryWithUser[]> {
  return queryEntityHistory(entityType, entityId);
}

/** Only returns history when the current user can access the task. */
export async function getTaskHistory(
  taskId: number,
): Promise<EntityHistoryWithUser[]> {
  const task = await getAccessibleTask(taskId);
  if (!task) return [];
  return queryEntityHistory('task', taskId);
}

/** Only returns history when the current user can access the project. */
export async function getProjectHistory(
  projectId: number,
): Promise<EntityHistoryWithUser[]> {
  const project = await getAccessibleProject(projectId);
  if (!project) return [];
  return queryEntityHistory('project', projectId);
}
