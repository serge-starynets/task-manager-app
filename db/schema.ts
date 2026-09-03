import { InferSelectModel, relations, sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  varchar,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from '@auth/core/adapters';

// Enums for task status, priority, project status, and user role
export const statusEnum = pgEnum('status', [
  'backlog',
  'todo',
  'in_progress',
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
export const roleEnum = pgEnum('role', ['admin', 'user']);

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
    name: text('name'),
    /** Stored lowercase; always normalize before lookup/write (see lib/users.ts). */
    email: text('email').notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    image: text('image'),
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

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  projects: many(projects),
  accounts: many(accounts),
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
export type RelatableTaskSummary = Pick<Task, 'id' | 'taskId' | 'title' | 'type'>;
export type RelatedTaskSummary = RelatableTaskSummary & {
  kind: TaskRelation['kind'];
};
