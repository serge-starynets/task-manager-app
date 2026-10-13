import { InferSelectModel, relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  pgEnum,
  varchar,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from '@auth/core/adapters';

// Enums for task status, priority, project status, and user role
export const statusEnum = pgEnum('status', [
  'backlog',
  'todo',
  'in_progress',
  'on_pause',
  'qa',
  'done',
  'rejected',
  'closed',
]);
export const priorityEnum = pgEnum('priority', [
  'low',
  'medium',
  'high',
  'critical',
]);
export const ticketTypeEnum = pgEnum('ticket_type', ['task', 'bug']);
export const severityEnum = pgEnum('severity', [
  'low',
  'medium',
  'high',
  'critical',
]);
export const relationKindEnum = pgEnum('relation_kind', [
  'related',
  'blocked_by',
]);
export const projectStatusEnum = pgEnum('project_status', [
  'not_started',
  'ongoing',
  'completed',
  'paused',
]);
/** Set once at creation; Software supports QA/Closed and Bugs, Other does not. */
export const projectTypeEnum = pgEnum('project_type', ['software', 'other']);
export const roleEnum = pgEnum('role', ['admin', 'user']);
export const entityHistoryTypeEnum = pgEnum('entity_history_type', [
  'task',
  'project',
]);
export const entityHistoryActionEnum = pgEnum('entity_history_action', [
  'created',
  'updated',
]);

// Projects table
export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    /** Short unique key per user (A–Z only, max 8). Stored uppercase. */
    abbreviation: varchar('abbreviation', { length: 8 }).notNull(),
    /** Quill HTML (sanitized on write). Plain text still works for older rows. */
    description: text('description'),
    status: projectStatusEnum('status').default('not_started').notNull(),
    type: projectTypeEnum('type').default('software').notNull(),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('projects_user_id_abbreviation_uidx').on(
      table.userId,
      table.abbreviation,
    ),
  ],
);

// Tasks table
export const tasks = pgTable(
  'tasks',
  {
    id: serial('id').primaryKey(),
    /** Human-readable ID: {PROJECT_ABBR}-{n}, e.g. WEB-1. Unique per user. */
    taskId: varchar('task_id', { length: 32 }).notNull(),
    title: text('title').notNull(),
    /** Quill HTML (sanitized on write). Plain text still works for older rows. */
    description: text('description'),
    status: statusEnum('status').default('backlog').notNull(),
    priority: priorityEnum('priority').default('medium').notNull(),
    type: ticketTypeEnum('type').default('task').notNull(),
    severity: severityEnum('severity'),
    /** Optional effort estimate in hours (0.5–80, half-hour steps). */
    estimation: real('estimation'),
    /**
     * Position within a Board column (same user, project, and status).
     * Lower values render higher. New tickets get a value below the current min.
     */
    boardOrder: integer('board_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    userId: text('user_id').notNull(),
    projectId: integer('project_id').references(() => projects.id),
  },
  (table) => [
    uniqueIndex('tasks_user_id_task_id_uidx').on(table.userId, table.taskId),
  ],
);

/**
 * Links between tickets. `related` is undirected (always taskIdA < taskIdB).
 * `blocked_by` is directed: taskIdA is blocked by taskIdB.
 */
export const taskRelations = pgTable(
  'task_relations',
  {
    id: serial('id').primaryKey(),
    taskIdA: integer('task_id_a')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    taskIdB: integer('task_id_b')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    kind: relationKindEnum('kind').default('related').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('task_relations_pair_kind_uidx').on(
      table.taskIdA,
      table.taskIdB,
      table.kind,
    ),
  ],
);

/** Files attached to a task (bytes live in Vercel Blob; metadata here). */
export const taskAttachments = pgTable('task_attachments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  url: text('url').notNull(),
  pathname: text('pathname').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users table
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    /** OAuth / Google display name (kept in sync by Auth.js). */
    name: text('name'),
    /** Stored lowercase; always normalize before lookup/write (see lib/users.ts). */
    email: text('email').notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    /** OAuth / Google avatar URL (kept in sync by Auth.js). */
    image: text('image'),
    /** App username when preferCustomProfile is true. Max 20 chars. */
    username: varchar('username', { length: 20 }),
    /** Custom avatar public Blob URL (jpg/png). */
    customImage: text('custom_image'),
    /** Blob pathname for deleting a previous custom avatar. */
    customImagePathname: text('custom_image_pathname'),
    /**
     * When true, show username + custom avatar in the app.
     * When false, show Google/OAuth name + image.
     */
    preferCustomProfile: boolean('prefer_custom_profile')
      .default(false)
      .notNull(),
    /** Null for OAuth-only accounts. */
    password: text('password'),
    role: roleEnum('role').default('user').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // Rejects case-variant duplicates even if a caller skips normalization.
    uniqueIndex('users_email_lower_uidx').on(sql`lower(${table.email})`),
  ],
);

/**
 * Personal sticky notes for a paper whiteboard.
 * `posX`/`posY` null = sitting in the notes stack; set = placed on the board.
 */
export const notes = pgTable(
  'notes',
  {
    id: serial('id').primaryKey(),
    /** Plain text only; max 140 chars enforced in validation. */
    content: varchar('content', { length: 140 }).notNull().default(''),
    posX: real('pos_x'),
    posY: real('pos_y'),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('notes_user_id_idx').on(table.userId)],
);

/** Rich-text comments on a task. */
export const taskComments = pgTable('task_comments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** Quill HTML (sanitized on write). */
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Audit trail for task/bug and project creates & field updates.
 * One row per creation or per changed field; rows from the same
 * mutation share `operationId` so the UI can group them.
 */
export const entityHistory = pgTable(
  'entity_history',
  {
    id: serial('id').primaryKey(),
    /** Shared across all field rows written in one create/update. */
    operationId: varchar('operation_id', { length: 36 }).notNull(),
    entityType: entityHistoryTypeEnum('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    /** Title snapshot at the time of the event. */
    entityName: text('entity_name').notNull(),
    action: entityHistoryActionEnum('action').notNull(),
    fieldName: varchar('field_name', { length: 64 }),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('entity_history_entity_created_idx').on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
    index('entity_history_operation_idx').on(table.operationId),
  ],
);

/** OAuth provider accounts linked to users (Auth.js). */
export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

// Relations between tables
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  relationsAsA: many(taskRelations, { relationName: 'taskA' }),
  relationsAsB: many(taskRelations, { relationName: 'taskB' }),
  attachments: many(taskAttachments),
  comments: many(taskComments),
}));

export const entityHistoryRelations = relations(entityHistory, ({ one }) => ({
  user: one(users, {
    fields: [entityHistory.userId],
    references: [users.id],
  }),
}));

export const taskRelationsRelations = relations(taskRelations, ({ one }) => ({
  taskA: one(tasks, {
    fields: [taskRelations.taskIdA],
    references: [tasks.id],
    relationName: 'taskA',
  }),
  taskB: one(tasks, {
    fields: [taskRelations.taskIdB],
    references: [tasks.id],
    relationName: 'taskB',
  }),
}));

export const taskAttachmentsRelations = relations(
  taskAttachments,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskAttachments.taskId],
      references: [tasks.id],
    }),
  }),
);

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  projects: many(projects),
  accounts: many(accounts),
  comments: many(taskComments),
  historyEntries: many(entityHistory),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Types
export type Task = InferSelectModel<typeof tasks>;
export type Project = InferSelectModel<typeof projects>;
export type User = InferSelectModel<typeof users>;
export type TaskRelation = InferSelectModel<typeof taskRelations>;
export type TaskAttachment = InferSelectModel<typeof taskAttachments>;
export type TaskComment = InferSelectModel<typeof taskComments>;
export type EntityHistory = InferSelectModel<typeof entityHistory>;
export type Note = InferSelectModel<typeof notes>;
export type RelatableTaskSummary = Pick<Task, 'id' | 'taskId' | 'title' | 'type'>;
export type RelatedTaskSummary = RelatableTaskSummary & {
  kind: TaskRelation['kind'];
};
