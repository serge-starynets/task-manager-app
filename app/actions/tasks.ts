'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/dal';
import {
  createTaskForUser,
  deleteTaskForUser,
  updateTaskForUser,
  updateTaskStatusForUser,
} from '@/lib/services/task-service';
import { forbiddenOrMessage } from '@/lib/actions/helpers';
import {
  CreateTaskActionInput,
  TaskData,
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
        error: forbiddenOrMessage(result.status, result.message),
      };
    }

    revalidateTag('tasks', 'max');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return {
      success: true,
      message: 'Task created successfully',
      projectId: result.data.projectId,
      taskId: result.data.id,
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

    const result = await updateTaskForUser(user, id, data);
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        errors: result.errors,
        error: forbiddenOrMessage(result.status, result.message),
      };
    }

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

    const result = await updateTaskStatusForUser(id, status);
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        errors: result.errors,
        error: forbiddenOrMessage(result.status, result.message),
      };
    }

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
