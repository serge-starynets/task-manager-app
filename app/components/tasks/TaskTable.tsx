import Link from 'next/link';
import { ClipboardListIcon, ListTodoIcon } from 'lucide-react';
import Badge from '@/app/components/ui/Badge';
import TicketTypeIcon from '@/app/components/tasks/TicketTypeIcon';
import { formatRelativeTime } from '@/lib/utils';
import { Priority, Status, TicketType } from '@/lib/types';
import { TASK_STATUS, TASK_PRIORITY, TICKET_TYPE } from '@/lib/constants/tasks';
import type { TaskWithUser } from '@/lib/types';

interface TaskTableProps {
  tasks: TaskWithUser[];
  emptyMessage?: string;
}

const gridClass =
  'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,4fr)_minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-4 px-6';

export default function TaskTable({
  tasks,
  emptyMessage = 'No tasks found',
}: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center surface-panel p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-dark-elevated dark:text-gray-500">
          <ClipboardListIcon size={24} />
        </div>
        <h3 className="text-lg font-semibold mb-1">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/80 dark:border-dark-border-default bg-white dark:bg-dark-high shadow-soft dark:shadow-none">
      <div
        className={`${gridClass} py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-dark-elevated border-b border-gray-200/80 dark:border-dark-border-default`}
      >
        <div className="flex items-center gap-1.5">
          <ListTodoIcon size={12} className="opacity-60" />
          ID
        </div>
        <div>Type</div>
        <div>Title</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Created</div>
        <div>Updated</div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-dark-border-subtle">
        {tasks.map((task) => {
          const ticketType = task.type as TicketType;
          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block hover:bg-gray-50/80 dark:hover:bg-dark-elevated/80 transition-colors duration-150"
            >
              <div className={`${gridClass} py-3.5 items-center`}>
                <div className="text-sm font-mono text-gray-500 dark:text-gray-400 truncate">
                  {task.taskId}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <TicketTypeIcon type={ticketType} />
                  <span>{TICKET_TYPE[ticketType].label}</span>
                </div>
                <div className="font-medium truncate text-gray-900 dark:text-gray-100">
                  {task.title}
                </div>
                <div>
                  <Badge status={task.status as Status}>
                    {TASK_STATUS[task.status as Status].label}
                  </Badge>
                </div>
                <div>
                  <Badge priority={task.priority as Priority}>
                    {TASK_PRIORITY[task.priority as Priority].label}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {formatRelativeTime(new Date(task.createdAt))}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {formatRelativeTime(new Date(task.updatedAt))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
