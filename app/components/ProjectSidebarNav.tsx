'use client';

import { useSearchParams } from 'next/navigation';
import { FolderIcon, FolderPlusIcon, PlusIcon } from 'lucide-react';
import type { Project } from '@/db/schema';
import NavLink from './NavLink';

interface ProjectSidebarNavProps {
  projects: Project[];
}

export default function ProjectSidebarNav({
  projects,
}: ProjectSidebarNavProps) {
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get('project');
  const canCreateMore = projects.length < 10;

  return (
    <nav className="flex-1 flex flex-col space-y-1 overflow-y-auto">
      <div className="px-2 mb-2 hidden md:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Projects
        </p>
      </div>

      {projects.map((project) => (
        <NavLink
          key={project.id}
          href={`/dashboard?project=${project.id}`}
          icon={<FolderIcon size={20} />}
          label={project.title}
          isActive={selectedProjectId === String(project.id)}
        />
      ))}

      {canCreateMore && (
        <NavLink
          href="/projects/new"
          icon={<FolderPlusIcon size={20} />}
          label="+ Create Project"
        />
      )}

      <NavLink
        href="/tasks/new"
        icon={<PlusIcon size={20} />}
        label="New Task"
      />
    </nav>
  );
}
