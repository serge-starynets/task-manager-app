'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderPlusIcon,
  LayoutGridIcon,
  ListIcon,
} from 'lucide-react';
import type { Project } from '@/db/schema';
import { cn } from '@/lib/utils';
import NavLink from './NavLink';
import CreateTicketMenu from '@/app/components/tasks/CreateTicketMenu';

interface ProjectSidebarNavProps {
  projects: Project[];
}

export default function ProjectSidebarNav({
  projects,
}: ProjectSidebarNavProps) {
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get('project');
  const view = searchParams.get('view');
  const isBoardView = view === 'board';
  const canCreateMore = projects.length < 10;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    selectedProjectId ? new Set([selectedProjectId]) : new Set(),
  );

  useEffect(() => {
    if (!selectedProjectId) return;
    setExpandedIds((prev) => {
      if (prev.has(selectedProjectId)) return prev;
      const next = new Set(prev);
      next.add(selectedProjectId);
      return next;
    });
  }, [selectedProjectId]);

  function toggleExpanded(projectId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  return (
    <nav className="flex-1 flex flex-col space-y-0.5 overflow-y-auto scrollbar-thin">
      <div className="px-2.5 mb-2 hidden md:block">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Projects
        </p>
      </div>

      {projects.map((project) => {
        const idStr = String(project.id);
        const isSelected = selectedProjectId === idStr;
        const isExpanded = expandedIds.has(idStr);
        const backlogHref = `/dashboard?project=${project.id}`;
        const boardHref = `/dashboard?project=${project.id}&view=board`;

        return (
          <div key={project.id} className="space-y-0.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => toggleExpanded(idStr)}
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded
                    ? `Collapse ${project.title}`
                    : `Expand ${project.title}`
                }
                className={cn(
                  'shrink-0 p-1.5 rounded-lg transition-colors',
                  'text-gray-500 hover:bg-gray-200/60 hover:text-gray-700',
                  'dark:text-gray-400 dark:hover:bg-dark-high dark:hover:text-gray-200',
                )}
              >
                {isExpanded ? (
                  <ChevronDownIcon size={14} />
                ) : (
                  <ChevronRightIcon size={14} />
                )}
              </button>
              <Link
                href={backlogHref}
                className={cn(
                  'flex min-w-0 flex-1 items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-smooth group',
                  isSelected
                    ? 'bg-purple-100/80 text-purple-700 shadow-sm dark:bg-purple-950/60 dark:text-purple-200 dark:shadow-none'
                    : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-dark-high',
                )}
              >
                <span
                  className={cn(
                    'mr-2.5 shrink-0 transition-colors',
                    isSelected
                      ? 'text-purple-600 dark:text-purple-300'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200',
                  )}
                >
                  <FolderIcon size={18} />
                </span>
                <span className="hidden md:inline truncate">
                  {project.abbreviation} · {project.title}
                </span>
              </Link>
            </div>

            {isExpanded && (
              <div className="ml-6 space-y-0.5 md:ml-7">
                <Link
                  href={backlogHref}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-lg transition-colors',
                    isSelected && !isBoardView
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200'
                      : 'text-gray-600 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-dark-high',
                  )}
                >
                  <ListIcon size={15} className="shrink-0 opacity-70" />
                  <span className="hidden md:inline">Backlog</span>
                </Link>
                <Link
                  href={boardHref}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-lg transition-colors',
                    isSelected && isBoardView
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200'
                      : 'text-gray-600 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-dark-high',
                  )}
                >
                  <LayoutGridIcon size={15} className="shrink-0 opacity-70" />
                  <span className="hidden md:inline">Board</span>
                </Link>
              </div>
            )}
          </div>
        );
      })}

      {canCreateMore && (
        <NavLink
          href="/projects/new"
          icon={<FolderPlusIcon size={18} />}
          label="Create Project"
        />
      )}

      <div className="my-2 mx-2 border-t border-gray-200/80 dark:border-dark-border-subtle" />

      <div className="px-2">
        <CreateTicketMenu
          size="md"
          menuAlign="start"
          className="w-full [&>button]:w-full"
        />
      </div>
    </nav>
  );
}
