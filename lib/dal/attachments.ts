import { db } from '@/db';
import { taskAttachments, type TaskAttachment } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

export async function getTaskAttachments(
  taskId: number,
): Promise<TaskAttachment[]> {
  try {
    return await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(asc(taskAttachments.createdAt));
  } catch (error) {
    console.error('Error fetching task attachments:', taskId, error);
    return [];
  }
}
