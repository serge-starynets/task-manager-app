import { InferSelectModel, relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Enums for task status, priority, project status, and user role
export const statusEnum = pgEnum('status', [
  'backlog',
  'todo',
  'in_progress',
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
export const projectStatusEnum = pgEnum('project_status', [
  'not_started',
  'ongoing',
  'completed',
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
    /** Human-readable ID: {PROJECT_ABBR}-{n}, e.g. WEB-1. Unique globally. */
    taskId: varchar('task_id', { length: 32 }).notNull(),
    title: text('title').notNull(),
    /** Quill HTML (sanitized on write). Plain text still works for older rows. */
    description: text('description'),
    status: statusEnum('status').default('backlog').notNull(),
    priority: priorityEnum('priority').default('medium').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    userId: text('user_id').notNull(),
    projectId: integer('project_id').references(() => projects.id),
  },
  (table) => [uniqueIndex('tasks_task_id_uidx').on(table.taskId)],
);

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations between tables
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  projects: many(projects),
}));

// Types
export type Task = InferSelectModel<typeof tasks>;
export type Project = InferSelectModel<typeof projects>;
export type User = InferSelectModel<typeof users>;

// Status and priority labels for display
export const TASK_STATUS = {
  backlog: { label: 'Backlog', value: 'backlog' },
  todo: { label: 'Todo', value: 'todo' },
  in_progress: { label: 'In Progress', value: 'in_progress' },
  done: { label: 'Done', value: 'done' },
  rejected: { label: 'Rejected', value: 'rejected' },
  closed: { label: 'Closed', value: 'closed' },
};

export const TASK_PRIORITY = {
  low: { label: 'Low', value: 'low' },
  medium: { label: 'Medium', value: 'medium' },
  high: { label: 'High', value: 'high' },
  critical: { label: 'Critical', value: 'critical' },
};

export const PROJECT_STATUS = {
  not_started: { label: 'Not started', value: 'not_started' },
  ongoing: { label: 'Ongoing', value: 'ongoing' },
  completed: { label: 'Completed', value: 'completed' },
};
