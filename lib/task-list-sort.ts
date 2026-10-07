export const TASK_LIST_SORT_COLUMNS = [
  'type',
  'title',
  'status',
  'priority',
  'createdAt',
  'updatedAt',
] as const;

export type TaskListSortColumn = (typeof TASK_LIST_SORT_COLUMNS)[number];

export type TaskListSortDir = 'asc' | 'desc';

export type TaskListSort = {
  by: TaskListSortColumn;
  dir: TaskListSortDir;
};

export const DEFAULT_TASK_LIST_SORT: TaskListSort = {
  by: 'updatedAt',
  dir: 'desc',
};

const COLUMN_LABELS: Record<TaskListSortColumn, string> = {
  type: 'Type',
  title: 'Title',
  status: 'Status',
  priority: 'Priority',
  createdAt: 'Created',
  updatedAt: 'Updated',
};

export function taskListSortColumnLabel(column: TaskListSortColumn): string {
  return COLUMN_LABELS[column];
}

function isSortColumn(value: string): value is TaskListSortColumn {
  return (TASK_LIST_SORT_COLUMNS as readonly string[]).includes(value);
}

export function parseTaskListSort(
  sortParam: string | undefined,
  dirParam: string | undefined,
): TaskListSort {
  if (!sortParam || !isSortColumn(sortParam)) {
    return DEFAULT_TASK_LIST_SORT;
  }

  const dir: TaskListSortDir =
    dirParam === 'asc' || dirParam === 'desc'
      ? dirParam
      : defaultDirForColumn(sortParam);

  return { by: sortParam, dir };
}

/** Direction when activating a column that is not currently sorted. */
export function defaultDirForColumn(column: TaskListSortColumn): TaskListSortDir {
  return column === 'createdAt' || column === 'updatedAt' ? 'desc' : 'asc';
}

export function nextSortForColumnClick(
  current: TaskListSort,
  column: TaskListSortColumn,
): TaskListSort {
  if (current.by === column) {
    return { by: column, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  }
  return { by: column, dir: defaultDirForColumn(column) };
}

export function buildDashboardBacklogSortHref(
  projectId: number,
  current: TaskListSort,
  column: TaskListSortColumn,
): string {
  const next = nextSortForColumnClick(current, column);
  const params = new URLSearchParams();
  params.set('project', String(projectId));

  if (
    next.by !== DEFAULT_TASK_LIST_SORT.by ||
    next.dir !== DEFAULT_TASK_LIST_SORT.dir
  ) {
    params.set('sort', next.by);
    params.set('dir', next.dir);
  }

  return `/dashboard?${params.toString()}`;
}
