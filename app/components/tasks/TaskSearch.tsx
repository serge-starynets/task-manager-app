'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { FormInput } from '@/app/components/ui/Form';
import TicketTypeIcon from '@/app/components/tasks/TicketTypeIcon';
import { stripHtml } from '@/lib/rich-text';
import { cn } from '@/lib/utils';
import type { TaskWithUser } from '@/lib/types';

const MAX_RESULTS = 12;

type TaskSearchProps = {
  tasks: TaskWithUser[];
  className?: string;
};

function matchesQuery(task: TaskWithUser, query: string): boolean {
  const haystacks = [task.taskId, task.title, stripHtml(task.description)].map(
    (value) => value.toLowerCase(),
  );

  return haystacks.some((value) => value.includes(query));
}

export default function TaskSearch({ tasks, className }: TaskSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (trimmed.length < 1) return [];
    return tasks
      .filter((task) => matchesQuery(task, trimmed))
      .slice(0, MAX_RESULTS);
  }, [tasks, trimmed]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative mb-4', className)}>
      <div className="relative">
        <SearchIcon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          aria-hidden
        />
        <FormInput
          id="task-search"
          type="search"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(next.trim().length > 0);
          }}
          onFocus={() => {
            if (trimmed.length > 0) setOpen(true);
          }}
          placeholder="Search..."
          autoComplete="off"
          aria-label="Search tasks and bugs"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="task-search-results"
          className="pl-9"
        />
      </div>

      {open && (
        <ul
          id="task-search-results"
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-black/[0.06] bg-white/95 py-1 shadow-lift backdrop-blur-md dark:border-white/[0.08] dark:bg-dark-high/95 dark:shadow-none"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No matching items
            </li>
          ) : (
            results.map((task) => (
              <li key={task.id} role="option">
                <Link
                  href={`/tasks/${task.id}`}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-elevated"
                  onClick={() => setOpen(false)}
                >
                  <TicketTypeIcon type={task.type} className="mt-0.5" />
                  <span className="shrink-0 font-mono text-gray-500 dark:text-gray-400">
                    {task.taskId}
                  </span>
                  <span className="min-w-0 break-words text-gray-900 dark:text-gray-100">
                    {task.title}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
