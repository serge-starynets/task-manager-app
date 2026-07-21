import Link from 'next/link';
import Badge from './ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { Priority, Status } from '@/lib/types';
import { TASK_STATUS, TASK_PRIORITY } from '@/db/schema';
import type { TaskWithUser } from '@/lib/types';

interface TaskTableProps {
  tasks: TaskWithUser[];
  emptyMessage?: string;
}

export default function TaskTable({
  tasks,
  emptyMessage = 'No tasks found',
}: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-gray-200 dark:border-dark-border-default rounded-lg bg-white dark:bg-dark-high p-8">
        <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-dark-border-default bg-white dark:bg-dark-high shadow-sm">
      <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-dark-elevated border-b border-gray-200 dark:border-dark-border-default">
        <div className="col-span-2">ID</div>
        <div className="col-span-3">Title</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Priority</div>
        <div className="col-span-2">Created</div>
        <div className="col-span-2">Updated</div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-dark-border-default">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="block hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors"
          >
            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
              <div className="col-span-2 text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
                {task.taskId}
              </div>
              <div className="font-medium truncate col-span-3">
                {task.title}
              </div>
              <div className="col-span-2">
                <Badge status={task.status as Status}>
                  {TASK_STATUS[task.status as Status].label}
                </Badge>
              </div>
              <div className="col-span-1">
                <Badge priority={task.priority as Priority}>
                  {TASK_PRIORITY[task.priority as Priority].label}
                </Badge>
              </div>
              <div className="col-span-2 text-xs text-gray-400 dark:text-gray-400">
                {formatRelativeTime(new Date(task.createdAt))}
              </div>
              <div className="col-span-2 text-xs text-gray-400 dark:text-gray-400">
                {formatRelativeTime(new Date(task.updatedAt))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
