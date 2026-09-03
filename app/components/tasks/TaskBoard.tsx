'use client';

import { useMemo, useState, useOptimistic, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { moveTaskOnBoard } from '@/app/actions/tasks';
import { compareBoardOrder, BOARD_STATUSES } from '@/lib/constants/tasks';
import type { Status, TaskWithUser } from '@/lib/types';
import BoardColumn from '@/app/components/tasks/BoardColumn';
import { BoardCardOverlay } from '@/app/components/tasks/BoardCard';

const STATUS_ORDER = BOARD_STATUSES as readonly Status[];

interface TaskBoardProps {
  tasks: TaskWithUser[];
}

type OptimisticAction = {
  taskId: number;
  status: Status;
  orderedIds: number[];
};

function groupTasksByStatus(taskList: TaskWithUser[]): Record<Status, TaskWithUser[]> {
  const grouped = Object.fromEntries(
    STATUS_ORDER.map((status) => [status, [] as TaskWithUser[]]),
  ) as Record<Status, TaskWithUser[]>;

  for (const task of [...taskList].sort(compareBoardOrder)) {
    const status = task.status as Status;
    if (grouped[status]) grouped[status].push(task);
  }
  return grouped;
}

function isBoardStatus(value: string): value is Status {
  return STATUS_ORDER.includes(value as Status);
}

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    const overCard = pointerHits.find((hit) => !isBoardStatus(String(hit.id)));
    return overCard ? [overCard] : pointerHits;
  }
  return closestCorners(args);
};

export default function TaskBoard({ tasks: initialTasks }: TaskBoardProps) {
  const router = useRouter();
  const [activeTask, setActiveTask] = useState<TaskWithUser | null>(null);
  const [overStatus, setOverStatus] = useState<Status | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticTasks, applyOptimistic] = useOptimistic(
    initialTasks,
    (current: TaskWithUser[], action: OptimisticAction) =>
      current.map((task) => {
        const index = action.orderedIds.indexOf(task.id);
        if (task.id === action.taskId) {
          return { ...task, status: action.status, boardOrder: index };
        }
        if (index === -1) return task;
        return { ...task, boardOrder: index };
      }),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const tasksByStatus = useMemo(
    () => groupTasksByStatus(optimisticTasks),
    [optimisticTasks],
  );

  function resolveDropStatus(overId: string | number, overStatus?: unknown): Status | null {
    if (typeof overStatus === 'string' && isBoardStatus(overStatus)) {
      return overStatus;
    }
    const id = String(overId);
    return isBoardStatus(id) ? id : null;
  }

  function handleDragStart(event: DragStartEvent) {
    const task = optimisticTasks.find((item) => String(item.id) === String(event.active.id));
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    if (!event.over) {
      setOverStatus(null);
      return;
    }
    setOverStatus(resolveDropStatus(event.over.id, event.over.data.current?.status));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    setOverStatus(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const task = optimisticTasks.find((item) => item.id === taskId);
    if (!task) return;
    if (String(over.id) === String(active.id)) return;

    const newStatus = resolveDropStatus(over.id, over.data.current?.status);
    if (!newStatus) return;

    const dest = tasksByStatus[newStatus].filter((item) => item.id !== taskId);
    const overIndex = dest.findIndex((item) => String(item.id) === String(over.id));
    const insertAt = overIndex >= 0 ? overIndex : dest.length;
    const nextColumn = [
      ...dest.slice(0, insertAt),
      { ...task, status: newStatus },
      ...dest.slice(insertAt),
    ];
    const orderedIds = nextColumn.map((item) => item.id);
    const unchanged =
      task.status === newStatus &&
      tasksByStatus[newStatus].every((item, index) => item.id === orderedIds[index]);
    if (unchanged) return;

    startTransition(async () => {
      applyOptimistic({ taskId, status: newStatus, orderedIds });
      const result = await moveTaskOnBoard(taskId, newStatus, orderedIds);
      if (!result.success) {
        toast.error(result.message || 'Failed to update board order');
        router.refresh();
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveTask(null);
        setOverStatus(null);
      }}
    >
      <div className="flex w-max max-w-full gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            isOver={overStatus === status}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <BoardCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
