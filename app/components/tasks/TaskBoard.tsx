'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
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
import { arrayMove } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { moveTaskOnBoard } from '@/app/actions/tasks';
import {
  compareBoardOrder,
  getBoardStatusesForProjectType,
} from '@/lib/constants/tasks';
import type { ProjectType, Status, TaskWithUser } from '@/lib/types';
import BoardColumn from '@/app/components/tasks/BoardColumn';
import { BoardCardOverlay } from '@/app/components/tasks/BoardCard';

interface TaskBoardProps {
  tasks: TaskWithUser[];
  projectType?: ProjectType;
}

type Columns = Record<Status, TaskWithUser[]>;

function groupTasksByStatus(
  taskList: TaskWithUser[],
  statusOrder: readonly Status[],
): Columns {
  const grouped = Object.fromEntries(
    statusOrder.map((status) => [status, [] as TaskWithUser[]]),
  ) as Columns;

  for (const task of [...taskList].sort(compareBoardOrder)) {
    const status = task.status as Status;
    if (grouped[status]) grouped[status].push(task);
  }
  return grouped;
}

function isBoardStatus(
  value: string,
  statusOrder: readonly Status[],
): value is Status {
  return statusOrder.includes(value as Status);
}

function findTaskColumn(
  columns: Columns,
  taskId: string,
  statusOrder: readonly Status[],
): Status | null {
  for (const status of statusOrder) {
    if (columns[status].some((task) => String(task.id) === taskId)) {
      return status;
    }
  }
  return null;
}

function withBoardOrder(tasks: TaskWithUser[], status: Status): TaskWithUser[] {
  return tasks.map((task, index) => ({
    ...task,
    status,
    boardOrder: index,
  }));
}

export default function TaskBoard({
  tasks: initialTasks,
  projectType,
}: TaskBoardProps) {
  const router = useRouter();
  const statusOrder = useMemo(
    () => getBoardStatusesForProjectType(projectType) as readonly Status[],
    [projectType],
  );
  const statusOrderRef = useRef(statusOrder);
  statusOrderRef.current = statusOrder;

  const [activeTask, setActiveTask] = useState<TaskWithUser | null>(null);
  const [overStatus, setOverStatus] = useState<Status | null>(null);
  const [columns, setColumns] = useState(() =>
    groupTasksByStatus(initialTasks, statusOrder),
  );
  const columnsRef = useRef(columns);
  const isDraggingRef = useRef(false);
  const [, startTransition] = useTransition();

  columnsRef.current = columns;

  // Sync from server props only — do not reset when a drag ends, or the card
  // flashes back to its old column before local drop state / refresh apply.
  useEffect(() => {
    if (isDraggingRef.current) return;
    setColumns(groupTasksByStatus(initialTasks, statusOrder));
  }, [initialTasks, statusOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const collisionDetection: CollisionDetection = (args) => {
    const order = statusOrderRef.current;
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) {
      const overCard = pointerHits.find(
        (hit) => !isBoardStatus(String(hit.id), order),
      );
      return overCard ? [overCard] : pointerHits;
    }
    return closestCorners(args);
  };

  const tasksById = useMemo(() => {
    const map = new Map<string, TaskWithUser>();
    for (const status of statusOrder) {
      for (const task of columns[status] ?? []) {
        map.set(String(task.id), task);
      }
    }
    return map;
  }, [columns, statusOrder]);

  function persistColumn(
    status: Status,
    ordered: TaskWithUser[],
    taskId: number,
  ) {
    const orderedIds = ordered.map((task) => task.id);
    const baseline = groupTasksByStatus(initialTasks, statusOrder)[status] ?? [];
    const unchanged =
      baseline.length === ordered.length &&
      baseline.every((task, index) => task.id === orderedIds[index]) &&
      ordered.every((task) => (task.status as Status) === status);

    if (unchanged) return;

    startTransition(async () => {
      const result = await moveTaskOnBoard(taskId, status, orderedIds);
      if (!result.success) {
        toast.error(result.message || 'Failed to update board order');
        setColumns(groupTasksByStatus(initialTasks, statusOrder));
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasksById.get(String(event.active.id));
    isDraggingRef.current = true;
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setOverStatus(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const order = statusOrderRef.current;
    const resolvedOverStatus = isBoardStatus(overId, order)
      ? overId
      : findTaskColumn(columnsRef.current, overId, order);
    setOverStatus(resolvedOverStatus);

    // Same column: sortable transforms open the gap live.
    // Cross column: move the card into the target list so siblings shift.
    setColumns((prev) => {
      const activeContainer = findTaskColumn(prev, activeId, order);
      const overContainer = isBoardStatus(overId, order)
        ? overId
        : findTaskColumn(prev, overId, order);

      if (!activeContainer || !overContainer) return prev;
      if (activeContainer === overContainer) return prev;

      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex(
        (task) => String(task.id) === activeId,
      );
      if (activeIndex < 0) return prev;

      const moving: TaskWithUser = {
        ...activeItems[activeIndex],
        status: overContainer,
      };

      let insertAt: number;
      if (isBoardStatus(overId, order)) {
        insertAt = overItems.length;
      } else {
        const overIndex = overItems.findIndex(
          (task) => String(task.id) === overId,
        );
        const isBelowOverItem =
          !!active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + over.rect.height / 2;
        insertAt =
          overIndex >= 0
            ? overIndex + (isBelowOverItem ? 1 : 0)
            : overItems.length;
      }

      return {
        ...prev,
        [activeContainer]: activeItems.filter(
          (task) => String(task.id) !== activeId,
        ),
        [overContainer]: [
          ...overItems.slice(0, insertAt),
          moving,
          ...overItems.slice(insertAt),
        ],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const dragged = activeTask;
    const order = statusOrderRef.current;

    if (!over || !dragged) {
      isDraggingRef.current = false;
      setActiveTask(null);
      setOverStatus(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const current = columnsRef.current;
    const activeContainer = findTaskColumn(current, activeId, order);
    const overContainer = isBoardStatus(overId, order)
      ? overId
      : findTaskColumn(current, overId, order);

    if (!activeContainer || !overContainer) {
      isDraggingRef.current = false;
      setActiveTask(null);
      setOverStatus(null);
      return;
    }

    if (activeContainer === overContainer) {
      const columnTasks = current[activeContainer];
      const oldIndex = columnTasks.findIndex(
        (task) => String(task.id) === activeId,
      );
      const newIndex = isBoardStatus(overId, order)
        ? columnTasks.length - 1
        : columnTasks.findIndex((task) => String(task.id) === overId);

      if (oldIndex < 0 || newIndex < 0) {
        isDraggingRef.current = false;
        setActiveTask(null);
        setOverStatus(null);
        return;
      }

      const movedAcrossColumns =
        (dragged.status as Status) !== activeContainer;

      if (oldIndex === newIndex) {
        // Cross-column insert already applied on dragOver; still persist it.
        if (movedAcrossColumns) {
          const ordered = withBoardOrder(columnTasks, activeContainer);
          setColumns((prev) => ({ ...prev, [activeContainer]: ordered }));
          persistColumn(activeContainer, ordered, dragged.id);
        }
        isDraggingRef.current = false;
        setActiveTask(null);
        setOverStatus(null);
        return;
      }

      const reordered = withBoardOrder(
        arrayMove(columnTasks, oldIndex, newIndex),
        activeContainer,
      );
      setColumns((prev) => ({ ...prev, [activeContainer]: reordered }));
      persistColumn(activeContainer, reordered, dragged.id);
      isDraggingRef.current = false;
      setActiveTask(null);
      setOverStatus(null);
      return;
    }

    // Dropped on another column before dragOver could move the card.
    const from = current[activeContainer].filter(
      (task) => String(task.id) !== activeId,
    );
    const moving = {
      ...current[activeContainer].find((task) => String(task.id) === activeId)!,
      status: overContainer,
    };
    const overItems = current[overContainer];
    const insertAt = isBoardStatus(overId, order)
      ? overItems.length
      : Math.max(
          0,
          overItems.findIndex((task) => String(task.id) === overId),
        );
    const nextOver = withBoardOrder(
      [...overItems.slice(0, insertAt), moving, ...overItems.slice(insertAt)],
      overContainer,
    );
    setColumns((prev) => ({
      ...prev,
      [activeContainer]: withBoardOrder(from, activeContainer),
      [overContainer]: nextOver,
    }));
    persistColumn(overContainer, nextOver, dragged.id);
    isDraggingRef.current = false;
    setActiveTask(null);
    setOverStatus(null);
  }

  function handleDragCancel() {
    isDraggingRef.current = false;
    setActiveTask(null);
    setOverStatus(null);
    setColumns(groupTasksByStatus(initialTasks, statusOrder));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="mx-auto flex w-[90%] gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {statusOrder.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={columns[status] ?? []}
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
