import type { ReactNode } from 'react';
import { HistoryIcon } from 'lucide-react';
import type { EntityHistoryWithUser } from '@/lib/dal/history';
import {
  HISTORY_ATTACHMENT_FIELD,
  formatHistoryTimestamp,
  groupHistoryEntries,
  historyActorName,
  historyFieldLabel,
  isHistoryEmptyValue,
  truncateHistoryValue,
} from '@/lib/entity-history';
import { cn } from '@/lib/utils';

function Accent({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </span>
  );
}

function StrikethroughValue({ value }: { value: string }) {
  return (
    <span className="text-gray-400 line-through decoration-gray-400/80 dark:text-gray-500 dark:decoration-gray-500/80">
      {value}
    </span>
  );
}

function PlainValue({ value }: { value: string }) {
  return (
    <span className="font-normal text-gray-600 dark:text-gray-400">{value}</span>
  );
}

export default function EntityHistoryList({
  entries,
  className,
  panel = true,
}: {
  entries: EntityHistoryWithUser[];
  className?: string;
  /** When false, render list only (e.g. inside Activity History tab). */
  panel?: boolean;
}) {
  const groups = groupHistoryEntries(entries);

  const list =
    groups.length === 0 ? (
      <p className="text-sm italic text-gray-500 dark:text-gray-400">
        No history yet.
      </p>
    ) : (
      <ul className="space-y-2.5">
        {groups.map((group) => {
          const at = formatHistoryTimestamp(group.createdAt);
          const actor = historyActorName(group.user);

          return (
            <li
              key={group.key}
              className="rounded-xl border border-black/[0.05] bg-gray-50/80 px-3.5 py-2.5 text-sm leading-relaxed text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-300"
            >
              {group.action === 'created' ? (
                <p>
                  at <Accent>{at}</Accent> <Accent>{actor}</Accent> created{' '}
                  {group.entityName}
                </p>
              ) : (
                <div className="space-y-1">
                  <p>
                    at <Accent>{at}</Accent> <Accent>{actor}</Accent> updated{' '}
                    {group.entityName}.
                  </p>
                  {group.changes.map((change, index) => {
                    if (change.fieldName === HISTORY_ATTACHMENT_FIELD) {
                      const added = isHistoryEmptyValue(change.oldValue);
                      const fileName = truncateHistoryValue(
                        added ? change.newValue : change.oldValue,
                      );
                      return (
                        <p key={`${group.key}-attachment-${index}`}>
                          {added ? 'Added attachment' : 'Removed attachment'}{' '}
                          <Accent>{fileName}</Accent>
                        </p>
                      );
                    }

                    const field = historyFieldLabel(
                      group.entityType,
                      change.fieldName,
                    );
                    const oldValue = truncateHistoryValue(change.oldValue);
                    const newValue = truncateHistoryValue(change.newValue);
                    return (
                      <p key={`${group.key}-${change.fieldName}-${index}`}>
                        Changed <Accent>{field}</Accent>{' '}
                        <StrikethroughValue value={oldValue} /> to{' '}
                        <PlainValue value={newValue} />
                      </p>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );

  if (!panel) {
    return <div className={className}>{list}</div>;
  }

  return (
    <div className={cn('surface-panel overflow-hidden p-6', className)}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <HistoryIcon size={18} className="text-gray-400" />
        History
      </h2>
      {list}
    </div>
  );
}
