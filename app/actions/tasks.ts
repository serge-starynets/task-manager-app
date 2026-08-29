'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { canManageTask, getCurrentUser, isAdmin } from '@/lib/dal';
import { sanitizeRichText } from '@/lib/rich-text';
import { createTaskForUser, deleteTaskForUser } from '@/lib/task-service';
import {
  CreateTaskActionInput,
  TaskData,
  TaskStatusSchema,
  UpdateTaskSchema,
} from '@/lib/validations/task';

export type { CreateTaskActionInput as CreateTaskInput, TaskData } from '@/lib/validations/task';

export type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
  projectId?: number | null;
  taskId?: number;
};

export async function createTask(
  data: CreateTaskActionInput,
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

export async function updateTaskStatus(
  id: number,
  status: TaskData['status'],
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

    const validationResult = TaskStatusSchema.safeParse(status);
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
