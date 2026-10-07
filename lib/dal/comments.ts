import { db } from '@/db';
import { taskComments, type TaskComment } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PUBLIC_USER_COLUMNS } from '@/lib/dal/users';

export type TaskCommentWithUser = TaskComment & {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
};

export async function getTaskComments(
  taskId: number,
): Promise<TaskCommentWithUser[]> {
  try {
    return await db.query.taskComments.findMany({
      where: eq(taskComments.taskId, taskId),
      with: {
        user: { columns: PUBLIC_USER_COLUMNS },
      },
      orderBy: (comments, { desc }) => [desc(comments.createdAt)],
    });
  } catch (error) {
    console.error('Error fetching task comments:', taskId, error);
    return [];
  }
}

export async function getTaskComment(
  commentId: number,
): Promise<TaskComment | null> {
  try {
    const [row] = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, commentId))
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.error('Error fetching task comment:', commentId, error);
    return null;
  }
}
