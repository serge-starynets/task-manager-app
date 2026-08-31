export const TASK_STATUS = {
  backlog: { label: 'Backlog', value: 'backlog' },
  todo: { label: 'Todo', value: 'todo' },
  in_progress: { label: 'In Progress', value: 'in_progress' },
  qa: { label: 'QA', value: 'qa' },
  done: { label: 'Done', value: 'done' },
  rejected: { label: 'Rejected', value: 'rejected' },
  closed: { label: 'Closed', value: 'closed' },
};

/** Statuses shown as Board columns (excludes backlog — those live in the list view). */
export const BOARD_STATUSES = [
  'todo',
  'in_progress',
  'qa',
  'done',
  'rejected',
  'closed',
] as const;

export const TASK_PRIORITY = {
  low: { label: 'Low', value: 'low' },
  medium: { label: 'Medium', value: 'medium' },
  high: { label: 'High', value: 'high' },
  critical: { label: 'Critical', value: 'critical' },
};
