'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Status, TaskWithUser } from '@/lib/types';
import { TASK_STATUS } from '@/lib/constants/tasks';
import { cn } from '@/lib/utils';
import BoardCard from '@/app/components/tasks/BoardCard';

interface BoardColumnProps {
  status: Status;
  tasks: TaskWithUser[];
}

export default function BoardColumn({ status, tasks }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'column', status },
  });

  return (
    <div
      className={cn(
        'flex w-[268px] shrink-0 flex-col rounded-xl border border-gray-200/80 bg-gray-50/80 dark:border-dark-border-default dark:bg-dark-elevated/60',
        isOver && 'ring-2 ring-purple-400/50 border-purple-300 dark:border-purple-700',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-200/80 dark:border-dark-border-subtle">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {TASK_STATUS[status].label}
        </h3>
        <span className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-dark-high px-1.5 py-0.5 rounded-md">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 p-2 min-h-[120px] max-h-[calc(100vh-16rem)] overflow-y-auto scrollbar-thin"
      >
        {tasks.map((task) => (
          <BoardCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-6">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  );
}
