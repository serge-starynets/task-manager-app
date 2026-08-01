import Link from 'next/link';
import { CheckSquareIcon, FolderPlusIcon, LogInIcon } from 'lucide-react';
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
    <aside className="fixed inset-y-0 left-0 w-16 md:w-64 bg-surface-muted/80 backdrop-blur-sm dark:bg-dark-elevated border-r border-gray-200/80 dark:border-dark-border-subtle flex flex-col py-4 px-2 md:px-3">
      <div className="flex items-center justify-center md:justify-between mb-6 px-1 md:px-2 gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group min-w-0"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm">
            <CheckSquareIcon size={16} strokeWidth={2.5} />
          </span>
          <span className="hidden md:inline text-base font-semibold tracking-tight text-gray-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
            Task Manager
          </span>
        </Link>
        <div className="hidden md:block shrink-0">
          <ThemeToggle />
        </div>
      </div>

      <div className="flex justify-center mb-4 md:hidden">
        <ThemeToggle />
      </div>

      <Suspense
        fallback={
          <nav className="flex-1 flex flex-col space-y-1">
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

      <div className="pt-4 mt-auto border-t border-gray-200/80 dark:border-dark-border-subtle">
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
