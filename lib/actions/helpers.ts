import { revalidatePath, revalidateTag } from 'next/cache';
import type { ServiceFailure } from '@/lib/services/types';

export type BaseActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
};

export function unauthorizedResponse(): BaseActionResponse {
  return {
    success: false,
    message: 'Unauthorized access',
    error: 'Unauthorized',
  };
}

export function forbiddenOrMessage(status: number, message: string): string {
  if (status === 403) {
    return 'Forbidden';
  }
  return message;
}

export function relationErrorCode(status: number): string {
  if (status === 403) {
    return 'Forbidden';
  }
  if (status === 404) {
    return 'NotFound';
  }
  return 'Invalid';
}

export function attachmentErrorCode(status: number, message: string): string {
  if (status === 403) {
    return 'Forbidden';
  }
  if (status === 404) {
    return 'Not found';
  }
  return message;
}

export function toActionResponse(
  result: ServiceFailure,
  mapError: (status: number, message: string) => string = forbiddenOrMessage,
): BaseActionResponse {
  return {
    success: false,
    message: result.message,
    errors: result.errors,
    error: mapError(result.status, result.message),
  };
}

export function revalidateTaskList() {
  revalidateTag('tasks', 'max');
  revalidatePath('/dashboard');
}

export function revalidateProjectViews() {
  revalidateTag('projects', 'max');
  revalidatePath('/dashboard');
}

export function revalidateTaskDetail(taskId: number) {
  revalidateTag('tasks', 'max');
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/tasks/${taskId}/edit`);
}

export function revalidateRelatedTaskViews(sourceId: number, targetId: number) {
  revalidateTaskList();
  revalidateTaskDetail(sourceId);
  revalidateTaskDetail(targetId);
}

export function createTaskErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.includes('Task attachments are limited')
  ) {
    return error.message;
  }
  return 'An error occurred while creating the task';
}

export function actionError(
  message: string,
  error: string,
): BaseActionResponse {
  return { success: false, message, error };
}
