'use server';

import { getCurrentUser } from '@/lib/dal';
import {
  actionError,
  createTaskErrorMessage,
  revalidateRelatedTaskViews,
  revalidateTaskList,
  toActionResponse,
  unauthorizedResponse,
} from '@/lib/actions/helpers';
import {
  createTaskForUser,
  deleteTaskForUser,
  updateTaskForUser,
  updateTaskStatusForUser,
} from '@/lib/services/task-service';
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
    if (!user) return unauthorizedResponse();

    const result = await createTaskForUser(user, {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      projectId: data.projectId ?? null,
      pendingAttachmentsJson: data.pendingAttachmentsJson,
      uploadSessionId: data.uploadSessionId,
      relatedTaskIds: data.relatedTaskIds,
    });

    if (!result.ok) return toActionResponse(result);

    revalidateTaskList();

    if (data.relatedTaskIds?.length) {
      for (const relatedId of data.relatedTaskIds) {
        revalidateRelatedTaskViews(result.data.id, relatedId);
      }
    }

    return {
      success: true,
      message: 'Task created successfully',
      projectId: result.data.projectId,
      taskId: result.data.id,
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return actionError(createTaskErrorMessage(error), 'Failed to create task');
  }
}

export async function updateTask(
  id: number,
  data: Partial<TaskData>,
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await updateTaskForUser(user, id, data);
    if (!result.ok) return toActionResponse(result);

    revalidateTaskList();
    return { success: true, message: 'Task updated successfully' };
  } catch (error) {
    console.error('Error updating task:', error);
    return actionError(
      'An error occurred while updating the task',
      'Failed to update task',
    );
  }
}

export async function updateTaskStatus(
  id: number,
  status: TaskData['status'],
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await updateTaskStatusForUser(id, status);
    if (!result.ok) return toActionResponse(result);

    revalidateTaskList();
    return { success: true, message: 'Task status updated successfully' };
  } catch (error) {
    console.error('Error updating task status:', error);
    return actionError(
      'An error occurred while updating the task status',
      'Failed to update task status',
    );
  }
}

export async function deleteTask(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const result = await deleteTaskForUser(id);
    if (!result.ok) {
      return actionError(
        'An error occurred while deleting the task.',
        'Failed to delete task of another user',
      );
    }

    revalidateTaskList();
    return { success: true, message: 'Task deleted successfully' };
  } catch (error) {
    console.error('Error deleting task:', error);
    return actionError(
      'An error occurred while deleting the task',
      'Failed to delete task',
    );
  }
}
