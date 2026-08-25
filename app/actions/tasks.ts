'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { canManageTask, getCurrentUser, isAdmin } from '@/lib/dal';
import { sanitizeRichText } from '@/lib/rich-text';
import { createTaskForUser, deleteTaskForUser } from '@/lib/task-service';
import { z } from 'zod';

const TaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),

  description: z.string().optional().nullable(),

  status: z.enum(
    ['backlog', 'todo', 'in_progress', 'qa', 'done', 'rejected', 'closed'],
    {
      errorMap: () => ({ message: 'Please select a valid status' }),
    },
  ),

  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'Please select a valid priority' }),
  }),
  userId: z.string().min(1, 'User ID is required'),
  projectId: z.number().int().positive().optional().nullable(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
});

export type TaskData = z.infer<typeof TaskSchema>;

export type CreateTaskInput = TaskData & {
  pendingAttachmentsJson?: string | null;
  uploadSessionId?: string | null;
};

export type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
  projectId?: number | null;
  taskId?: number;
};

export async function createTask(
  data: CreateTaskInput,
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Unauthorized',
      };
    }

    const result = await createTaskForUser(user, {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      projectId: data.projectId ?? null,
      pendingAttachmentsJson: data.pendingAttachmentsJson,
      uploadSessionId: data.uploadSessionId,
    });

    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        errors: result.errors,
        error: result.status === 403 ? 'Forbidden' : result.message,
      };
    }

    revalidateTag('tasks', 'max');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return {
      success: true,
      message: 'Task created successfully',
      projectId: result.task.projectId,
      taskId: result.task.id,
    };
  } catch (error) {
    console.error('Error creating task:', error);
    const message =
      error instanceof Error &&
      error.message.includes('Task attachments are limited')
        ? error.message
        : 'An error occurred while creating the task';
    return {
      success: false,
      message,
      error: 'Failed to create task',
    };
  }
}

export async function updateTask(
  id: number,
  data: Partial<TaskData>,
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Unauthorized',
      };
    }

    const canManage = await canManageTask(id);
    if (!canManage) {
      return {
        success: false,
        message: 'You do not have permission to update this task',
        error: 'Forbidden',
      };
    }

    const timestamp = Date.now();
    const updatedDate = new Date(timestamp);

    const newData = {
      ...data,
      updatedAt: updatedDate,
    };

    const UpdateTaskSchema = TaskSchema.partial();
    const validationResult = UpdateTaskSchema.safeParse(newData);

    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const validatedData = validationResult.data;
    const updateData: Record<string, unknown> = {};

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = sanitizeRichText(validatedData.description);
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority;
    if (validatedData.userId !== undefined && isAdmin(user)) {
      updateData.userId = validatedData.userId;
    }
    updateData.updatedAt = validatedData.updatedAt;

    await db.update(tasks).set(updateData).where(eq(tasks.id, id));
    revalidateTag('tasks', 'max');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return { success: true, message: 'Task updated successfully' };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      success: false,
      message: 'An error occurred while updating the task',
      error: 'Failed to update task',
    };
  }
}

const StatusSchema = z.enum(
  ['backlog', 'todo', 'in_progress', 'qa', 'done', 'rejected', 'closed'],
  {
    errorMap: () => ({ message: 'Please select a valid status' }),
  },
);

export async function updateTaskStatus(
  id: number,
  status: z.infer<typeof StatusSchema>,
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Unauthorized',
      };
    }

    const canManage = await canManageTask(id);
    if (!canManage) {
      return {
        success: false,
        message: 'You do not have permission to update this task',
        error: 'Forbidden',
      };
    }

    const validationResult = StatusSchema.safeParse(status);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { status: ['Please select a valid status'] },
      };
    }

    await db
      .update(tasks)
      .set({
        status: validationResult.data,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id));

    revalidateTag('tasks', 'max');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return { success: true, message: 'Task status updated successfully' };
  } catch (error) {
    console.error('Error updating task status:', error);
    return {
      success: false,
      message: 'An error occurred while updating the task status',
      error: 'Failed to update task status',
    };
  }
}

export async function deleteTask(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const result = await deleteTaskForUser(id);
    if (!result.ok) {
      return {
        success: false,
        message: 'An error occurred while deleting the task.',
        error: 'Failed to delete task of another user',
      };
    }

    revalidateTag('tasks', 'max');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return { success: true, message: 'Task deleted successfully' };
  } catch (error) {
    console.error('Error deleting task:', error);
    return {
      success: false,
      message: 'An error occurred while deleting the task',
      error: 'Failed to delete task',
    };
  }
}
