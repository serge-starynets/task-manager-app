import 'server-only';

import { randomUUID } from 'crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { entityHistory, users, type Project, type Task } from '@/db/schema';
import {
  HISTORY_ATTACHMENT_FIELD,
  formatProjectFieldValue,
  formatTaskFieldValue,
  type HistoryEntityType,
  type HistoryFieldChange,
} from '@/lib/entity-history';

async function resolveAssigneeLabels(
  changes: HistoryFieldChange[],
): Promise<HistoryFieldChange[]> {
  const assigneeChange = changes.find((change) => change.fieldName === 'userId');
  if (!assigneeChange) return changes;

  const ids = [assigneeChange.oldValue, assigneeChange.newValue].filter(
    (value): value is string => Boolean(value) && value !== '(empty)',
  );
  if (ids.length === 0) return changes;

  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(inArray(users.id, ids));
  const labels = new Map(
    rows.map((row) => [row.id, row.name?.trim() || row.email]),
  );

  return changes.map((change) => {
    if (change.fieldName !== 'userId') return change;
    return {
      ...change,
      oldValue:
        change.oldValue && change.oldValue !== '(empty)'
          ? (labels.get(change.oldValue) ?? change.oldValue)
          : change.oldValue,
      newValue:
        change.newValue && change.newValue !== '(empty)'
          ? (labels.get(change.newValue) ?? change.newValue)
          : change.newValue,
    };
  });
}

async function insertHistoryRows(
  rows: {
    operationId: string;
    entityType: HistoryEntityType;
    entityId: number;
    entityName: string;
    action: 'created' | 'updated';
    fieldName?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    userId: string;
  }[],
): Promise<void> {
  if (rows.length === 0) return;
  try {
    await db.insert(entityHistory).values(
      rows.map((row) => ({
        operationId: row.operationId,
        entityType: row.entityType,
        entityId: row.entityId,
        entityName: row.entityName,
        action: row.action,
        fieldName: row.fieldName ?? null,
        oldValue: row.oldValue ?? null,
        newValue: row.newValue ?? null,
        userId: row.userId,
      })),
    );
  } catch (error) {
    // Never fail the primary mutation because audit logging failed.
    console.error('Failed to write entity history:', error);
  }
}

export async function deleteEntityHistory(
  entityType: HistoryEntityType,
  entityId: number,
): Promise<void> {
  try {
    await db
      .delete(entityHistory)
      .where(
        and(
          eq(entityHistory.entityType, entityType),
          eq(entityHistory.entityId, entityId),
        ),
      );
  } catch (error) {
    console.error(
      'Failed to delete entity history:',
      entityType,
      entityId,
      error,
    );
  }
}

export async function recordEntityCreated(input: {
  entityType: HistoryEntityType;
  entityId: number;
  entityName: string;
  userId: string;
}): Promise<void> {
  await insertHistoryRows([
    {
      ...input,
      operationId: randomUUID(),
      action: 'created',
    },
  ]);
}

export async function recordEntityFieldChanges(input: {
  entityType: HistoryEntityType;
  entityId: number;
  entityName: string;
  userId: string;
  changes: HistoryFieldChange[];
}): Promise<void> {
  if (input.changes.length === 0) return;
  const changes =
    input.entityType === 'task'
      ? await resolveAssigneeLabels(input.changes)
      : input.changes;
  const operationId = randomUUID();
  await insertHistoryRows(
    changes.map((change) => ({
      operationId,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      action: 'updated' as const,
      fieldName: change.fieldName,
      oldValue: change.oldValue,
      newValue: change.newValue,
      userId: input.userId,
    })),
  );
}

export async function recordAttachmentsAdded(input: {
  taskId: number;
  entityName: string;
  userId: string;
  fileNames: string[];
}): Promise<void> {
  const fileNames = input.fileNames.filter(Boolean);
  if (fileNames.length === 0) return;
  await recordEntityFieldChanges({
    entityType: 'task',
    entityId: input.taskId,
    entityName: input.entityName,
    userId: input.userId,
    changes: fileNames.map((fileName) => ({
      fieldName: HISTORY_ATTACHMENT_FIELD,
      oldValue: null,
      newValue: fileName,
    })),
  });
}

export async function recordAttachmentRemoved(input: {
  taskId: number;
  entityName: string;
  userId: string;
  fileName: string;
}): Promise<void> {
  if (!input.fileName) return;
  await recordEntityFieldChanges({
    entityType: 'task',
    entityId: input.taskId,
    entityName: input.entityName,
    userId: input.userId,
    changes: [
      {
        fieldName: HISTORY_ATTACHMENT_FIELD,
        oldValue: input.fileName,
        newValue: null,
      },
    ],
  });
}

const TASK_TRACKED_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'severity',
  'estimation',
  'userId',
] as const;

type TaskTrackedField = (typeof TASK_TRACKED_FIELDS)[number];

export function diffTaskFields(
  before: Task,
  after: Task,
): HistoryFieldChange[] {
  const changes: HistoryFieldChange[] = [];
  for (const field of TASK_TRACKED_FIELDS) {
    const oldRaw = before[field as TaskTrackedField];
    const newRaw = after[field as TaskTrackedField];
    if (field === 'estimation') {
      const oldHours = oldRaw == null ? null : Number(oldRaw);
      const newHours = newRaw == null ? null : Number(newRaw);
      if (oldHours == null && newHours == null) continue;
      if (
        oldHours != null &&
        newHours != null &&
        Math.abs(oldHours - newHours) < 1e-6
      ) {
        continue;
      }
    } else if (Object.is(oldRaw, newRaw)) {
      continue;
    }
    if (
      field === 'description' &&
      (oldRaw ?? null) === (newRaw ?? null)
    ) {
      continue;
    }
    if (field === 'severity' && (oldRaw ?? null) === (newRaw ?? null)) {
      continue;
    }
    changes.push({
      fieldName: field,
      oldValue: formatTaskFieldValue(field, oldRaw),
      newValue: formatTaskFieldValue(field, newRaw),
    });
  }
  return changes;
}

const PROJECT_TRACKED_FIELDS = [
  'title',
  'description',
  'status',
] as const;

type ProjectTrackedField = (typeof PROJECT_TRACKED_FIELDS)[number];

export function diffProjectFields(
  before: Project,
  after: Project,
): HistoryFieldChange[] {
  const changes: HistoryFieldChange[] = [];
  for (const field of PROJECT_TRACKED_FIELDS) {
    const oldRaw = before[field as ProjectTrackedField];
    const newRaw = after[field as ProjectTrackedField];
    if (Object.is(oldRaw, newRaw)) continue;
    if (
      field === 'description' &&
      (oldRaw ?? null) === (newRaw ?? null)
    ) {
      continue;
    }
    changes.push({
      fieldName: field,
      oldValue: formatProjectFieldValue(field, oldRaw),
      newValue: formatProjectFieldValue(field, newRaw),
    });
  }
  return changes;
}
