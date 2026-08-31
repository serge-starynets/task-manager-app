import {
  getTasksForProject,
  getOrphanedTasks,
  getProjects,
  isAdmin,
  requireUser,
} from '@/lib/dal';
import { stripHtml } from '@/lib/rich-text';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ThemeToggler';
import SignOutButton from '../components/SignOutButton';
import {
  Edit2Icon,
  FolderIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import TaskTable from '../components/TaskTable';
import TaskBoard from '../components/TaskBoard';
import { PROJECT_STATUS } from '@/lib/constants/projects';
import { type Project, type User } from '@/db/schema';

function OrphanedTasksSection({
  tasks,
}: {
  tasks: Awaited<ReturnType<typeof getOrphanedTasks>>;
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-gray-200/80 dark:border-dark-border-default">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ListTodoIcon size={18} className="text-gray-400" />
          Tasks without a project
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          These tasks are not assigned to any project.
        </p>
      </div>
      <TaskTable tasks={tasks} />
    </section>
  );
}

function DashboardHome({
  user,
  projects,
}: {
  user: User;
  projects: Project[];
}) {
  const canCreateMore = projects.length < 10;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
            <LayoutDashboardIcon size={20} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <ThemeToggle />
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
          {canCreateMore && projects.length > 0 && (
            <Link href="/projects/new">
              <Button size="sm">
                <PlusIcon size={16} />
                Create Project
              </Button>
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center surface-panel p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950/50 dark:text-purple-300">
              <FolderOpenIcon size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
              Create a project to organize your tasks.
            </p>
            <Link href="/projects/new">
              <Button>
                <PlusIcon size={18} />
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="rounded-xl border border-gray-200/80 dark:border-dark-border-default overflow-hidden divide-y divide-gray-100 dark:divide-dark-border-subtle bg-white dark:bg-dark-high shadow-soft dark:shadow-none">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard?project=${project.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/80 dark:hover:bg-dark-elevated/80 transition-colors duration-150"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-dark-elevated dark:text-gray-400">
                    <FolderIcon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400 mr-2">
                      {project.abbreviation}
                    </span>
                    <span className="font-medium break-words">
                      {project.title}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-panel p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4">Profile</h2>
        <div className="flex items-start gap-3 mb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-dark-elevated dark:text-gray-400">
            <UserIcon size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium break-words">{user.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
              {isAdmin(user) ? 'Admin' : 'Standard user'}
            </p>
          </div>
        </div>

        <div className="space-y-1 border-t border-gray-100 dark:border-dark-border-subtle pt-4">
          <span
            aria-disabled="true"
            className="flex items-center w-full px-2.5 py-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed pointer-events-none select-none rounded-lg"
          >
            <SettingsIcon size={18} className="mr-2" />
            <span>Settings</span>
            <span className="ml-2 text-xs">(coming soon)</span>
          </span>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; view?: string }>;
}) {
  const user = await requireUser();
  const { project: projectParam, view: viewParam } = await searchParams;
  const projects = await getProjects(user.id);

  if (!projectParam) {
    return <DashboardHome user={user} projects={projects} />;
  }

  const selectedProjectId = parseInt(projectParam, 10);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (!selectedProject) {
    notFound();
  }

  const isBoardView = viewParam === 'board';
  const orphanedTasks = isBoardView
    ? []
    : await getOrphanedTasks(user.id);
  const projectTasks = await getTasksForProject(user.id, selectedProject.id);

  const statusLabel =
    PROJECT_STATUS[selectedProject.status as keyof typeof PROJECT_STATUS]
      ?.label ?? selectedProject.status;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight min-w-0">
            <span className="text-gray-500 dark:text-gray-400 font-semibold mr-2">
              {selectedProject.abbreviation}
            </span>
            {selectedProject.title}
          </h1>
          <Link
            href={`/projects/${selectedProject.id}/edit`}
            className="shrink-0"
          >
            <Button variant="outline" size="sm">
              <Edit2Icon size={16} />
              Edit
            </Button>
          </Link>
        </div>
        <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">
          {statusLabel}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {selectedProject.description
            ? stripHtml(selectedProject.description)
            : ''}
        </p>
      </div>

      <section className="mb-10">
        <div className={isBoardView ? 'w-fit max-w-full' : undefined}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              {isBoardView ? 'Board' : 'Backlog'}
            </h2>
            <Link href={`/tasks/new?project=${selectedProject.id}`}>
              <Button data-testid="new-task-button" size="sm">
                <PlusIcon size={16} />
                New Task
              </Button>
            </Link>
          </div>
          {isBoardView ? (
            <TaskBoard tasks={projectTasks} />
          ) : projectTasks.length > 0 ? (
            <TaskTable tasks={projectTasks} />
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center surface-panel p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-dark-elevated dark:text-gray-500">
                <ListTodoIcon size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Get started by creating your first task in this project.
              </p>
            </div>
          )}
        </div>
      </section>

      {!isBoardView && <OrphanedTasksSection tasks={orphanedTasks} />}
    </div>
  );
}
