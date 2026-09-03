'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { XIcon } from 'lucide-react';
import type { RelatableTaskSummary, RelatedTaskSummary } from '@/db/schema';
import {
  addTaskRelation,
  removeTaskRelation,
  searchRelatableTasks,
  searchRelatableTasksForNewTask,
} from '@/app/actions/task-relations';
import { FormGroup, FormInput, FormLabel, FormSelect } from '@/app/components/ui/Form';
import TicketTypeIcon from '@/app/components/tasks/TicketTypeIcon';
import { RELATION_KIND } from '@/lib/constants/tasks';
import type { RelationKind, TicketType } from '@/lib/types';

const kindOptions = Object.values(RELATION_KIND).map(({ label, value }) => ({
  label,
  value,
}));

type RelatedTasksPickerEditProps = {
  mode: 'edit';
  taskId: number;
  initialRelated: RelatedTaskSummary[];
  targetType: TicketType;
  label: string;
};

type RelatedTasksPickerCreateProps = {
  mode: 'create';
  projectId: number | null;
  selected: RelatedTaskSummary[];
  onSelectedChange: (tasks: RelatedTaskSummary[]) => void;
  targetType: TicketType;
  label: string;
};

type RelatedTasksPickerProps =
  | RelatedTasksPickerEditProps
  | RelatedTasksPickerCreateProps;

export default function RelatedTasksPicker(props: RelatedTasksPickerProps) {
  const isEditMode = props.mode === 'edit';
  const taskId = isEditMode ? props.taskId : undefined;
  const projectId = isEditMode ? null : props.projectId;
  const { targetType, label } = props;

  const [related, setRelated] = useState<RelatedTaskSummary[]>(
    isEditMode ? props.initialRelated : props.selected,
  );
  const [kind, setKind] = useState<RelationKind>('related');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RelatableTaskSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [isMutating, startMutate] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.mode === 'edit') {
      setRelated(props.initialRelated);
    }
  }, [props]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      startSearch(async () => {
        const excludeIds = related
          .filter((task) => task.kind === kind)
          .map((task) => task.id);
        const matches = isEditMode
          ? await searchRelatableTasks(
              taskId!,
              trimmed,
              targetType,
              excludeIds,
            )
          : await searchRelatableTasksForNewTask(
              projectId,
              trimmed,
              excludeIds,
              targetType,
            );
        setResults(matches);
        setOpen(true);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, taskId, projectId, isEditMode, related, targetType, kind]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function addRelatedTask(target: RelatableTaskSummary, nextKind: RelationKind) {
    const next = [...related, { ...target, kind: nextKind }].sort((a, b) =>
      a.taskId.localeCompare(b.taskId),
    );
    setRelated(next);
    if (!isEditMode) {
      props.onSelectedChange(next);
    }
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function removeRelatedTask(target: RelatedTaskSummary) {
    const next = related.filter(
      (task) => !(task.id === target.id && task.kind === target.kind),
    );
    setRelated(next);
    if (!isEditMode) {
      props.onSelectedChange(next);
    }
  }

  function handleSelect(target: RelatableTaskSummary) {
    if (isEditMode) {
      startMutate(async () => {
        const result = await addTaskRelation(taskId!, target.id, kind);
        if (result.success) {
          toast.success(result.message);
          addRelatedTask(target, kind);
        } else {
          toast.error(result.message);
        }
      });
      return;
    }

    addRelatedTask(target, kind);
  }

  function handleRemove(target: RelatedTaskSummary) {
    if (isEditMode) {
      startMutate(async () => {
        const result = await removeTaskRelation(
          taskId!,
          target.id,
          target.kind,
        );
        if (result.success) {
          toast.success(result.message);
          removeRelatedTask(target);
        } else {
          toast.error(result.message);
        }
      });
      return;
    }

    removeRelatedTask(target);
  }

  return (
    <FormGroup>
      <FormLabel htmlFor={`related-${targetType}-search`}>{label}</FormLabel>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)]">
        <FormSelect
          id={`related-${targetType}-kind`}
          options={kindOptions}
          value={kind}
          onChange={(value) => setKind(value as RelationKind)}
          disabled={isMutating}
        />
        <div ref={containerRef} className="relative">
          <FormInput
            id={`related-${targetType}-search`}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            placeholder="Search by title or ticket number…"
            disabled={isMutating}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
          />
          {open && (
            <ul
              role="listbox"
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200/80 bg-white py-1 shadow-lift dark:border-dark-border-medium dark:bg-dark-high dark:shadow-none"
            >
              {isSearching && results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>
              ) : results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">
                  No tickets found
                </li>
              ) : (
                results.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      role="option"
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-high"
                      onClick={() => handleSelect(task)}
                      disabled={isMutating}
                    >
                      <TicketTypeIcon
                        type={task.type}
                        className="mt-0.5"
                      />
                      <span className="shrink-0 font-mono text-gray-500 dark:text-gray-400">
                        {task.taskId}
                      </span>
                      <span className="min-w-0 break-words">{task.title}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <ul className="mt-2 space-y-1">
          {related.map((task) => (
            <li
              key={`${task.kind}-${task.id}`}
              className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-dark-border-medium"
            >
              {isEditMode ? (
                <Link
                  href={`/tasks/${task.id}`}
                  className="flex min-w-0 flex-1 items-start gap-2 hover:underline"
                >
                  <TicketTypeIcon
                    type={task.type}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {RELATION_KIND[task.kind].label}
                    </span>
                    <span className="mx-2 font-mono text-gray-500 dark:text-gray-400">
                      {task.taskId}
                    </span>
                    <span className="mx-1 text-gray-300 dark:text-gray-600">
                      ·
                    </span>
                    <span className="break-words">{task.title}</span>
                  </span>
                </Link>
              ) : (
                <span className="flex min-w-0 flex-1 items-start gap-2">
                  <TicketTypeIcon
                    type={task.type}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {RELATION_KIND[task.kind].label}
                    </span>
                    <span className="mx-2 font-mono text-gray-500 dark:text-gray-400">
                      {task.taskId}
                    </span>
                    <span className="mx-1 text-gray-300 dark:text-gray-600">
                      ·
                    </span>
                    <span className="break-words">{task.title}</span>
                  </span>
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(task)}
                disabled={isMutating}
                className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-dark-high dark:hover:text-gray-200"
                aria-label={`Remove ${RELATION_KIND[task.kind].label} ${task.taskId}`}
              >
                <XIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </FormGroup>
  );
}
