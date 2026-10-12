import type { ProjectType } from '@/lib/validations/project';

export const TASK_STATUS = {
  backlog: { label: 'Backlog', value: 'backlog' },
  todo: { label: 'Todo', value: 'todo' },
  in_progress: { label: 'In Progress', value: 'in_progress' },
  on_pause: { label: 'On Pause', value: 'on_pause' },
  qa: { label: 'QA', value: 'qa' },
  done: { label: 'Done', value: 'done' },
  rejected: { label: 'Rejected', value: 'rejected' },
  closed: { label: 'Closed', value: 'closed' },
};

/** Statuses shown as Board columns (excludes backlog — those live in the list view). */
export const BOARD_STATUSES = [
  'todo',
  'in_progress',
  'on_pause',
  'qa',
  'done',
  'rejected',
  'closed',
] as const;

/** Task statuses unavailable on "Other" projects. */
export const OTHER_PROJECT_EXCLUDED_STATUSES = ['qa', 'closed'] as const;

/** Task statuses only available on "Other" projects. */
export const OTHER_PROJECT_ONLY_STATUSES = ['on_pause'] as const;

export function projectAllowsBugs(
  projectType: ProjectType | null | undefined,
): boolean {
  return projectType !== 'other';
}

export function isTaskStatusAllowedForProjectType(
  status: string,
  projectType: ProjectType | null | undefined,
): boolean {
  if ((OTHER_PROJECT_ONLY_STATUSES as readonly string[]).includes(status)) {
    return projectType === 'other';
  }
  if (projectType === 'other') {
    return !(OTHER_PROJECT_EXCLUDED_STATUSES as readonly string[]).includes(
      status,
    );
  }
  return true;
}

export function getTaskStatusOptionsForProjectType(
  projectType: ProjectType | null | undefined,
) {
  return Object.values(TASK_STATUS).filter(({ value }) =>
    isTaskStatusAllowedForProjectType(value, projectType),
  );
}

export function getBoardStatusesForProjectType(
  projectType: ProjectType | null | undefined,
): readonly (typeof BOARD_STATUSES)[number][] {
  return BOARD_STATUSES.filter((status) =>
    isTaskStatusAllowedForProjectType(status, projectType),
  );
}

export const TASK_PRIORITY = {
  low: { label: 'Low', value: 'low' },
  medium: { label: 'Medium', value: 'medium' },
  high: { label: 'High', value: 'high' },
  critical: { label: 'Critical', value: 'critical' },
};

export const TICKET_TYPE = {
  task: { label: 'Task', value: 'task' },
  bug: { label: 'Bug', value: 'bug' },
};

/** Older cache rows / pre-migration payloads may omit type. */
export function resolveTicketType(
  type: string | null | undefined,
): keyof typeof TICKET_TYPE {
  return type === 'bug' ? 'bug' : 'task';
}

/** Formats hours as "1h", "2h 30 min", or "30 min". */
export function formatEstimationHours(
  hours: number | null | undefined,
): string | null {
  if (hours == null || Number.isNaN(hours)) return null;
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes <= 0) return null;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m} min`;
}

export const TASK_SEVERITY = {
  low: { label: 'Low', value: 'low' },
  medium: { label: 'Medium', value: 'medium' },
  high: { label: 'High', value: 'high' },
  critical: { label: 'Critical', value: 'critical' },
};

export const RELATION_KIND = {
  related: { label: 'Related to', value: 'related' },
  blocked_by: { label: 'Blocked by', value: 'blocked_by' },
};

/** Lower `boardOrder` renders higher in a Board column. */
export function compareBoardOrder(
  a: { boardOrder?: number; createdAt: Date | string; id: number },
  b: { boardOrder?: number; createdAt: Date | string; id: number },
): number {
  const aOrder = a.boardOrder ?? 0;
  const bOrder = b.boardOrder ?? 0;
  if (aOrder !== bOrder) return aOrder - bOrder;

  const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
  const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
  if (aTime !== bTime) return bTime - aTime;

  return b.id - a.id;
}
