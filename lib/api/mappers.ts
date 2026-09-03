import type { Project, Task, TaskAttachment, User } from '@/db/schema';
import type { RelatedTaskSummary } from '@/db/schema';
import type { AttachmentDto } from '@/lib/dto/attachment';
import type { ProjectDto } from '@/lib/dto/project';
import type { RelatedTaskDto, TaskDto } from '@/lib/dto/task';
import type { UserDto } from '@/lib/dto/user';
import type { TaskWithUser } from '@/lib/types';

function toIsoString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

export function userToDto(
  user: Pick<User, 'id' | 'email'> & { role?: User['role'] },
): UserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role ?? 'user',
  };
}

export function taskToDto(task: Task | TaskWithUser): TaskDto {
  const dto: TaskDto = {
    id: task.id,
    taskId: task.taskId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    type: task.type,
    severity: task.severity,
    projectId: task.projectId,
    userId: task.userId,
    createdAt: toIsoString(task.createdAt),
    updatedAt: toIsoString(task.updatedAt),
  };

  if ('user' in task && task.user) {
    dto.user = userToDto(task.user);
  }

  return dto;
}

export function relatedTaskToDto(task: RelatedTaskSummary): RelatedTaskDto {
  return {
    id: task.id,
    taskId: task.taskId,
    title: task.title,
    type: task.type,
    kind: task.kind,
  };
}

export function projectToDto(project: Project): ProjectDto {
  return {
    id: project.id,
    title: project.title,
    abbreviation: project.abbreviation,
    description: project.description,
    status: project.status,
    userId: project.userId,
    createdAt: toIsoString(project.createdAt),
    updatedAt: toIsoString(project.updatedAt),
  };
}

export function attachmentToDto(attachment: TaskAttachment): AttachmentDto {
  return {
    id: attachment.id,
    taskId: attachment.taskId,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    url: attachment.url,
    pathname: attachment.pathname,
    uploadedBy: attachment.uploadedBy,
    createdAt: toIsoString(attachment.createdAt),
  };
}
