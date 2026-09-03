import { revalidatePath, revalidateTag } from 'next/cache';

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
