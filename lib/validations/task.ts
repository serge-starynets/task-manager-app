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

export const TICKET_TYPES = ['task', 'bug'] as const;

export const TASK_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export const RELATION_KINDS = ['related', 'blocked_by'] as const;

export const TaskStatusSchema = z.enum(TASK_STATUSES, {
  errorMap: () => ({ message: 'Please select a valid status' }),
});

export const TaskPrioritySchema = z.enum(TASK_PRIORITIES, {
  errorMap: () => ({ message: 'Please select a valid priority' }),
});

export const TicketTypeSchema = z.enum(TICKET_TYPES, {
  errorMap: () => ({ message: 'Please select a valid type' }),
});

export const TaskSeveritySchema = z.enum(TASK_SEVERITIES, {
  errorMap: () => ({ message: 'Please select a valid severity' }),
});

export const RelationKindSchema = z.enum(RELATION_KINDS, {
  errorMap: () => ({ message: 'Please select a valid relation' }),
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TicketType = z.infer<typeof TicketTypeSchema>;
export type TaskSeverity = z.infer<typeof TaskSeveritySchema>;
export type RelationKind = z.infer<typeof RelationKindSchema>;

export const TicketRelationSchema = z.object({
  targetId: z.number().int().positive(),
  kind: RelationKindSchema.default('related'),
});

export type TicketRelationInput = z.infer<typeof TicketRelationSchema>;

function applyTicketTypeRules<
  T extends { type?: TicketType; severity?: TaskSeverity | null },
>(data: T, ctx: z.RefinementCtx) {
  if (data.type === 'task') {
    data.severity = null;
    return;
  }

  if (data.type === 'bug' && data.severity == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['severity'],
      message: 'Please select a valid severity',
    });
  }
}

const titleSchema = z
  .string()
  .min(3, 'Title must be at least 3 characters')
  .max(100, 'Title must be less than 100 characters');

/** Schema for creating a task (service layer). */
export const CreateTaskSchema = z
  .object({
    title: titleSchema,
    description: z.string().optional().nullable(),
    status: TaskStatusSchema.default('backlog'),
    priority: TaskPrioritySchema.default('medium'),
    type: TicketTypeSchema.default('task'),
    severity: TaskSeveritySchema.optional().nullable(),
    projectId: z.number().int().positive().optional().nullable(),
    relatedTaskIds: z.array(z.number().int().positive()).optional(),
    relations: z.array(TicketRelationSchema).optional(),
  })
  .superRefine(applyTicketTypeRules);

export type CreateTaskInput = z.input<typeof CreateTaskSchema>;

export type CreateTaskServiceInput = CreateTaskInput & {
  pendingAttachmentsJson?: string | null;
  uploadSessionId?: string | null;
  relatedTaskIds?: number[];
  relations?: TicketRelationInput[];
};

/** Full task schema for server actions (includes userId, timestamps). */
export const TaskSchema = z.object({
  title: titleSchema,
  description: z.string().optional().nullable(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  type: TicketTypeSchema,
  severity: TaskSeveritySchema.optional().nullable(),
  userId: z.string().min(1, 'User ID is required'),
  projectId: z.number().int().positive().optional().nullable(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
});

export type TaskData = z.infer<typeof TaskSchema>;

export const UpdateTaskSchema = TaskSchema.partial();

export const MoveTaskOnBoardSchema = z.object({
  status: TaskStatusSchema,
  orderedTaskIds: z.array(z.number().int().positive()).min(1),
});

export type MoveTaskOnBoardInput = z.infer<typeof MoveTaskOnBoardSchema>;

export type CreateTaskActionInput = TaskData & {
  pendingAttachmentsJson?: string | null;
  uploadSessionId?: string | null;
  relatedTaskIds?: number[];
  relations?: TicketRelationInput[];
};
