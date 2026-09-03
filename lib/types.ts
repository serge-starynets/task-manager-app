import { Task, Project } from '@/db/schema';
export type {
  TaskStatus as Status,
  TaskPriority as Priority,
  TicketType,
  TaskSeverity as Severity,
  RelationKind,
  ProjectStatus,
} from '@/lib/validations';

export type TaskWithUser = Task & {
  user: {
    id: string;
    email: string;
    role?: 'admin' | 'user';
  };
};

export type ProjectWithUser = Project & {
  user: {
    id: string;
    email: string;
  };
};
