import { format } from 'date-fns';
import {
  PROJECT_STATUS,
  PROJECT_TYPE,
} from '@/lib/constants/projects';
import {
  TASK_PRIORITY,
  TASK_SEVERITY,
  TASK_STATUS,
  formatEstimationHours,
} from '@/lib/constants/tasks';
import { stripHtml } from '@/lib/rich-text';
import { displayUserName, type DisplayUser } from '@/lib/user-display';

export type HistoryEntityType = 'task' | 'project';

export type HistoryFieldChange = {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
};

export const HISTORY_VALUE_MAX_CHARS = 500;
const EMPTY = '(empty)';

function truncate(text: string, max = HISTORY_VALUE_MAX_CHARS): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return EMPTY;
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

/** Truncate a stored history value for display (max 500 chars). */
export function truncateHistoryValue(
  value: string | null | undefined,
): string {
  if (value == null || value === '') return EMPTY;
  return truncate(value, HISTORY_VALUE_MAX_CHARS);
}

export function formatHistoryTimestamp(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return format(parsed, 'dd.MM.yyyy:HH:mm');
}

export function historyActorName(user: DisplayUser): string {
  return displayUserName(user);
}

export function formatHistoryDescriptionValue(
  value: string | null | undefined,
): string {
  return truncate(stripHtml(value));
}

export function formatTaskFieldValue(
  field: string,
  value: unknown,
): string | null {
  if (value === null || value === undefined || value === '') return EMPTY;

  switch (field) {
    case 'status':
      return (
        TASK_STATUS[value as keyof typeof TASK_STATUS]?.label ?? String(value)
      );
    case 'priority':
      return (
        TASK_PRIORITY[value as keyof typeof TASK_PRIORITY]?.label ??
        String(value)
      );
    case 'severity':
      return (
        TASK_SEVERITY[value as keyof typeof TASK_SEVERITY]?.label ??
        String(value)
      );
    case 'estimation': {
      const hours =
        typeof value === 'number' ? value : Number(value);
      return formatEstimationHours(hours) ?? EMPTY;
    }
    case 'description':
      return formatHistoryDescriptionValue(
        typeof value === 'string' ? value : String(value),
      );
    case 'title':
      return truncate(String(value));
    case 'userId':
      return String(value);
    case 'attachment':
      return truncate(String(value));
    default:
      return truncate(String(value));
  }
}

export function formatProjectFieldValue(
  field: string,
  value: unknown,
): string | null {
  if (value === null || value === undefined || value === '') return EMPTY;

  switch (field) {
    case 'status':
      return (
        PROJECT_STATUS[value as keyof typeof PROJECT_STATUS]?.label ??
        String(value)
      );
    case 'type':
      return (
        PROJECT_TYPE[value as keyof typeof PROJECT_TYPE]?.label ?? String(value)
      );
    case 'description':
      return formatHistoryDescriptionValue(
        typeof value === 'string' ? value : String(value),
      );
    case 'title':
    case 'abbreviation':
      return truncate(String(value));
    default:
      return truncate(String(value));
  }
}

/** History field used for attachment add/remove rows (file name in values). */
export const HISTORY_ATTACHMENT_FIELD = 'attachment';

export function isHistoryEmptyValue(
  value: string | null | undefined,
): boolean {
  return value == null || value === '' || value === EMPTY;
}

const TASK_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
  severity: 'Severity',
  estimation: 'Estimation',
  userId: 'Assignee',
  attachment: 'Attachment',
};

const PROJECT_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  status: 'Status',
  type: 'Type',
  abbreviation: 'Abbreviation',
};

export function historyFieldLabel(
  entityType: HistoryEntityType,
  fieldName: string | null | undefined,
): string {
  if (!fieldName) return '';
  const map =
    entityType === 'project' ? PROJECT_FIELD_LABELS : TASK_FIELD_LABELS;
  return map[fieldName] ?? fieldName;
}

export type HistoryEntryLike = {
  id: number;
  operationId?: string | null;
  createdAt: Date | string;
  action: 'created' | 'updated';
  entityName: string;
  entityType: HistoryEntityType;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  userId: string;
  user: DisplayUser;
};

export type HistoryGroup = {
  key: string;
  createdAt: Date | string;
  action: 'created' | 'updated';
  entityName: string;
  entityType: HistoryEntityType;
  user: DisplayUser;
  changes: {
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
  }[];
};

/** Group field-level rows that belong to the same mutation. */
export function groupHistoryEntries(
  entries: HistoryEntryLike[],
): HistoryGroup[] {
  const groups = new Map<string, HistoryGroup>();
  const order: string[] = [];

  for (const entry of entries) {
    const key =
      entry.operationId ||
      `legacy:${new Date(entry.createdAt).getTime()}:${entry.userId}:${entry.action}:${entry.entityType}:${entry.id}`;

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        createdAt: entry.createdAt,
        action: entry.action,
        entityName: entry.entityName,
        entityType: entry.entityType,
        user: entry.user,
        changes: [],
      };
      groups.set(key, group);
      order.push(key);
    }

    if (entry.action === 'updated') {
      group.changes.push({
        fieldName: entry.fieldName,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
      });
    }
  }

  // Within each group, show fields in insertion order (ascending id).
  // Entries arrive newest-first; reverse changes collected from desc id order.
  for (const group of groups.values()) {
    if (group.changes.length > 1) {
      group.changes.reverse();
    }
  }

  return order.map((key) => groups.get(key)!);
}

/** Number of user-visible history operations (grouped), not raw field rows. */
export function countHistoryOperations(entries: HistoryEntryLike[]): number {
  return groupHistoryEntries(entries).length;
}
