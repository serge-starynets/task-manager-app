import { Task, Project } from '@/db/schema';

export type Status =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'rejected'
  | 'closed';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectStatus = 'not_started' | 'ongoing' | 'completed';

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
