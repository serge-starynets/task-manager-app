import { z } from 'zod';

export const TASK_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'qa',
  'done',
  'rejected',
  'closed',
] as const;

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export const TaskStatusSchema = z.enum(TASK_STATUSES, {
  errorMap: () => ({ message: 'Please select a valid status' }),
});

export const TaskPrioritySchema = z.enum(TASK_PRIORITIES, {
  errorMap: () => ({ message: 'Please select a valid priority' }),
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

/** Schema for creating a task (service layer). */
export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().optional().nullable(),
  status: TaskStatusSchema.default('backlog'),
  priority: TaskPrioritySchema.default('medium'),
  projectId: z.number().int().positive().optional().nullable(),
  relatedTaskIds: z.array(z.number().int().positive()).optional(),
});

export type CreateTaskInput = z.input<typeof CreateTaskSchema>;

export type CreateTaskServiceInput = CreateTaskInput & {
  pendingAttachmentsJson?: string | null;
  uploadSessionId?: string | null;
  relatedTaskIds?: number[];
};

/** Full task schema for server actions (includes userId, timestamps). */
export const TaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().optional().nullable(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  userId: z.string().min(1, 'User ID is required'),
  projectId: z.number().int().positive().optional().nullable(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
});

export type TaskData = z.infer<typeof TaskSchema>;

export const UpdateTaskSchema = TaskSchema.partial();

export type CreateTaskActionInput = TaskData & {
  pendingAttachmentsJson?: string | null;
  uploadSessionId?: string | null;
  relatedTaskIds?: number[];
};
