'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BugIcon, ChevronDownIcon, ListTodoIcon, PlusIcon } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { cn } from '@/lib/utils';

export default function CreateTicketMenu({
  projectId,
  size = 'sm',
  testId,
  className,
  menuAlign = 'end',
}: {
  projectId?: number;
  size?: 'sm' | 'md';
  testId?: string;
  className?: string;
  menuAlign?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const taskHref =
    projectId !== undefined ? `/tasks/new?project=${projectId}` : '/tasks/new';
  const bugHref =
    projectId !== undefined ? `/bugs/new?project=${projectId}` : '/bugs/new';

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

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        type="button"
        size={size}
        data-testid={testId}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <PlusIcon size={16} />
        Create New
        <ChevronDownIcon
          size={14}
          className={cn('opacity-80 transition-transform', open && 'rotate-180')}
        />
      </Button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-20 mt-1.5 min-w-44 overflow-hidden rounded-xl border border-gray-200/80 bg-white py-1 shadow-lift dark:border-dark-border-default dark:bg-dark-high dark:shadow-none',
            menuAlign === 'end' ? 'right-0' : 'left-0',
          )}

        >
          <Link
            href={taskHref}
            role="menuitem"
            data-testid="new-task-link"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-elevated"
            onClick={() => setOpen(false)}
          >
            <ListTodoIcon size={16} className="text-blue-500 dark:text-blue-400" />
            New Task
          </Link>
          <Link
            href={bugHref}
            role="menuitem"
            data-testid="new-bug-link"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-elevated"
            onClick={() => setOpen(false)}
          >
            <BugIcon size={16} className="text-red-500 dark:text-red-400" />
            New Bug
          </Link>
        </div>
      )}
    </div>
  );
}
