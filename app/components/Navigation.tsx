import Link from 'next/link';
import { FolderPlusIcon, LogInIcon } from 'lucide-react';
import { Suspense } from 'react';
import UserEmail from './UserEmail';
import NavLink from './NavLink';
import ThemeToggle from '@/app/components/ThemeToggler';
import ProjectSidebarNav from './ProjectSidebarNav';
import { getCurrentUser, getProjects } from '@/lib/dal';

export default async function Navigation() {
  const user = await getCurrentUser();
  const projects = user ? await getProjects(user.id) : [];

  return (
    <aside className="fixed inset-y-0 left-0 w-16 md:w-64 bg-gray-50 dark:bg-dark-elevated border-r border-gray-200 dark:border-dark-border-subtle flex flex-col py-4 px-2 md:px-4">
      <div className="flex items-center justify-center md:justify-start mb-6">
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center md:justify-start mb-8 px-2">
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          <span className="hidden md:inline">Task Manager</span>
          <span className="md:hidden">TM</span>
        </Link>
      </div>

      <Suspense
        fallback={
          <nav className="flex-1 flex flex-col space-y-1">
            <NavLink
              href="/projects/new"
              icon={<FolderPlusIcon size={20} />}
              label="+ Create Project"
            />
          </nav>
        }
      >
        <ProjectSidebarNav projects={projects} />
      </Suspense>

      <div className="pt-4 border-t border-gray-200 dark:border-dark-border-subtle">
        <Suspense
          fallback={
            <NavLink
              href="/signin"
              icon={<LogInIcon size={20} />}
              label="Sign In"
            />
          }
        >
          <UserEmail />
        </Suspense>
      </div>
    </aside>
  );
}
