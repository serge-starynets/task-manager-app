import { Issue } from '@/db/schema';

export type Status =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'rejected'
  | 'closed';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type IssueWithUser = Issue & {
  user: {
    id: string;
    email: string;
  };
};
