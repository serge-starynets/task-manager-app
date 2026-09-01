'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { XIcon } from 'lucide-react';
import type { RelatedTaskSummary } from '@/db/schema';
import {
  addTaskRelation,
  removeTaskRelation,
  searchRelatableTasks,
  searchRelatableTasksForNewTask,
} from '@/app/actions/task-relations';
import { FormGroup, FormInput, FormLabel } from '@/app/components/ui/Form';

type RelatedTasksPickerEditProps = {
  mode: 'edit';
  taskId: number;
  initialRelated: RelatedTaskSummary[];
};

type RelatedTasksPickerCreateProps = {
  mode: 'create';
  projectId: number | null;
  selected: RelatedTaskSummary[];
  onSelectedChange: (tasks: RelatedTaskSummary[]) => void;
};

type RelatedTasksPickerProps =
  | RelatedTasksPickerEditProps
  | RelatedTasksPickerCreateProps;

export default function RelatedTasksPicker(props: RelatedTasksPickerProps) {
  const isEditMode = props.mode === 'edit';
  const taskId = isEditMode ? props.taskId : undefined;
  const projectId = isEditMode ? null : props.projectId;

  const [related, setRelated] = useState<RelatedTaskSummary[]>(
    isEditMode ? props.initialRelated : props.selected,
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RelatedTaskSummary[]>([]);
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
        const excludeIds = related.map((task) => task.id);
        const matches = isEditMode
          ? await searchRelatableTasks(taskId!, trimmed)
          : await searchRelatableTasksForNewTask(
              projectId,
              trimmed,
              excludeIds,
            );
        setResults(matches);
        setOpen(true);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, taskId, projectId, isEditMode, related]);

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

  function addRelatedTask(target: RelatedTaskSummary) {
    const next = [...related, target].sort((a, b) =>
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
    const next = related.filter((task) => task.id !== target.id);
    setRelated(next);
    if (!isEditMode) {
      props.onSelectedChange(next);
    }
  }

  function handleSelect(target: RelatedTaskSummary) {
    if (isEditMode) {
      startMutate(async () => {
        const result = await addTaskRelation(taskId!, target.id);
        if (result.success) {
          toast.success(result.message);
          addRelatedTask(target);
        } else {
          toast.error(result.message);
        }
      });
      return;
    }

    addRelatedTask(target);
  }

  function handleRemove(target: RelatedTaskSummary) {
    if (isEditMode) {
      startMutate(async () => {
        const result = await removeTaskRelation(taskId!, target.id);
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
      <FormLabel htmlFor="related-tasks-search">Related tasks</FormLabel>
      <div ref={containerRef} className="relative">
        <FormInput
          id="related-tasks-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder="Search by title or task number…"
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
              <li className="px-3 py-2 text-sm text-gray-500">No tasks found</li>
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

      {related.length > 0 && (
        <ul className="mt-2 space-y-1">
          {related.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-dark-border-medium"
            >
              {isEditMode ? (
                <Link
                  href={`/tasks/${task.id}`}
                  className="min-w-0 flex-1 hover:underline"
                >
                  <span className="font-mono text-gray-500 dark:text-gray-400">
                    {task.taskId}
                  </span>
                  <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                  <span className="break-words">{task.title}</span>
                </Link>
              ) : (
                <span className="min-w-0 flex-1">
                  <span className="font-mono text-gray-500 dark:text-gray-400">
                    {task.taskId}
                  </span>
                  <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                  <span className="break-words">{task.title}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(task)}
                disabled={isMutating}
                className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-dark-high dark:hover:text-gray-200"
                aria-label={`Remove related task ${task.taskId}`}
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
