import Link from 'next/link';
import { ClipboardListIcon, ListTodoIcon } from 'lucide-react';
import Badge from '@/app/components/ui/Badge';
import TicketTypeIcon from '@/app/components/tasks/TicketTypeIcon';
import { formatRelativeTime } from '@/lib/utils';
import { Priority, Status } from '@/lib/types';
import {
  TASK_STATUS,
  TASK_PRIORITY,
  TICKET_TYPE,
  resolveTicketType,
} from '@/lib/constants/tasks';
import type { TaskWithUser } from '@/lib/types';

interface TaskTableProps {
  tasks: TaskWithUser[];
  emptyMessage?: string;
}

const gridClass =
  'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,4fr)_minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-4 px-5';

export default function TaskTable({
  tasks,
  emptyMessage = 'No tasks found',
}: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="surface-panel flex flex-col items-center justify-center p-8 py-14 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-dark-elevated dark:text-gray-500">
          <ClipboardListIcon size={24} />
        </div>
        <h3 className="mb-1 text-lg font-semibold">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/90 shadow-soft dark:border-white/[0.08] dark:bg-dark-high dark:shadow-none">
      <div
        className={`${gridClass} border-b border-black/[0.05] bg-gray-50/70 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-500`}
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

      <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
        {tasks.map((task) => {
          const ticketType = resolveTicketType(task.type);
          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block transition-colors duration-150 hover:bg-violet-50/50 dark:hover:bg-white/[0.04]"
            >
              <div className={`${gridClass} items-center py-3`}>
                <div className="truncate font-mono text-[13px] text-gray-400 dark:text-gray-500">
                  {task.taskId}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <TicketTypeIcon type={ticketType} />
                  <span>{TICKET_TYPE[ticketType].label}</span>
                </div>
                <div className="truncate font-medium text-gray-900 dark:text-gray-100">
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
                <div className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                  {formatRelativeTime(new Date(task.createdAt))}
                </div>
                <div className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
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
