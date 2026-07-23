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
} from '@/app/actions/task-relations';
import { FormGroup, FormInput, FormLabel } from './ui/Form';

interface RelatedTasksPickerProps {
  taskId: number;
  initialRelated: RelatedTaskSummary[];
}

export default function RelatedTasksPicker({
  taskId,
  initialRelated,
}: RelatedTasksPickerProps) {
  const [related, setRelated] = useState(initialRelated);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RelatedTaskSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [isMutating, startMutate] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRelated(initialRelated);
  }, [initialRelated]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      startSearch(async () => {
        const matches = await searchRelatableTasks(taskId, trimmed);
        setResults(matches);
        setOpen(true);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, taskId]);

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

  function handleSelect(target: RelatedTaskSummary) {
    startMutate(async () => {
      const result = await addTaskRelation(taskId, target.id);
      if (result.success) {
        toast.success(result.message);
        setRelated((prev) =>
          [...prev, target].sort((a, b) => a.taskId.localeCompare(b.taskId)),
        );
        setQuery('');
        setResults([]);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleRemove(target: RelatedTaskSummary) {
    startMutate(async () => {
      const result = await removeTaskRelation(taskId, target.id);
      if (result.success) {
        toast.success(result.message);
        setRelated((prev) => prev.filter((t) => t.id !== target.id));
      } else {
        toast.error(result.message);
      }
    });
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
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-md dark:border-dark-border-medium dark:bg-dark-elevated"
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
