import { Suspense } from 'react';
import { FolderPlusIcon } from 'lucide-react';
import NavLink from './NavLink';
import ProjectSidebarNav from './ProjectSidebarNav';
import { getCurrentUser, getProjects } from '@/lib/dal';

export default async function Navigation() {
  const user = await getCurrentUser();
  const projects = user ? await getProjects(user.id) : [];

  return (
    <aside className="absolute inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-gray-200/80 bg-surface-muted/80 px-2 py-4 backdrop-blur-sm dark:border-dark-border-subtle dark:bg-dark-elevated md:w-64 md:px-3">
      <Suspense
        fallback={
          <nav className="flex flex-1 flex-col space-y-1">
            <NavLink
              href="/projects/new"
              icon={<FolderPlusIcon size={20} />}
              label="Create Project"
            />
          </nav>
        }
      >
        <ProjectSidebarNav projects={projects} />
      </Suspense>
    </aside>
  );
}
