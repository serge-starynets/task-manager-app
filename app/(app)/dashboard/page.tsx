import {
  getCurrentUser,
  getTasksForProject,
  getOrphanedTasks,
  getProjects,
  isAdmin,
} from '@/lib/dal';
import { stripHtml } from '@/lib/rich-text';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import {
  Edit2Icon,
  FolderIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListIcon,
  ListTodoIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import TaskTable from '@/app/components/tasks/TaskTable';
import TaskBoard from '@/app/components/tasks/TaskBoard';
import CreateTicketMenu from '@/app/components/tasks/CreateTicketMenu';
import { PROJECT_STATUS } from '@/lib/constants/projects';
import { type Project, type User } from '@/db/schema';
import { cn } from '@/lib/utils';

const PROJECT_TILE_TONES = [
  'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
];

function projectStatusVariant(
  status: string,
): 'secondary' | 'default' | 'success' | 'warning' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'paused':
      return 'warning';
    case 'ongoing':
      return 'default';
    default:
      return 'secondary';
  }
}

function OrphanedTasksSection({
  tasks,
}: {
  tasks: Awaited<ReturnType<typeof getOrphanedTasks>>;
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="mt-12 border-t border-black/[0.06] pt-10 dark:border-white/[0.08]">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
          <ListTodoIcon size={18} className="text-gray-400" />
          Tasks without a project
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
          <LayoutDashboardIcon size={20} />
        </span>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your projects and profile
          </p>
        </div>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
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
          <div className="surface-panel flex flex-col items-center justify-center p-8 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 dark:bg-violet-950/50 dark:text-violet-300">
              <FolderOpenIcon size={24} />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
            <p className="mb-6 max-w-sm text-gray-500 dark:text-gray-400">
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
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard?project=${project.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/80 px-4 py-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:border-white/[0.08] dark:bg-dark-high dark:shadow-none dark:hover:border-white/[0.14]"
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold',
                      PROJECT_TILE_TONES[project.id % PROJECT_TILE_TONES.length],
                    )}
                  >
                    {project.abbreviation}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium break-words text-gray-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                      {project.title}
                    </span>
                    <span className="mt-1 inline-flex">
                      <Badge
                        variant={projectStatusVariant(project.status)}
                      >
                        {PROJECT_STATUS[
                          project.status as keyof typeof PROJECT_STATUS
                        ]?.label ?? project.status}
                      </Badge>
                    </span>
                  </span>
                  <FolderIcon
                    size={16}
                    className="shrink-0 text-gray-300 transition-colors group-hover:text-violet-400 dark:text-gray-600"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-panel p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Profile</h2>
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-dark-elevated dark:text-gray-400">
            <UserIcon size={18} />
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-medium">{user.email}</p>
            <p className="mt-0.5 text-xs capitalize text-gray-500 dark:text-gray-400">
              {isAdmin(user) ? 'Admin' : 'Standard user'}
            </p>
          </div>
        </div>

        <div className="space-y-1 border-t border-black/[0.05] pt-4 dark:border-white/[0.06]">
          <span
            aria-disabled="true"
            className="pointer-events-none flex w-full cursor-not-allowed select-none items-center rounded-lg px-2.5 py-2 text-sm text-gray-400 dark:text-gray-500"
          >
            <SettingsIcon size={18} className="mr-2" />
            <span>Settings</span>
            <span className="ml-2 text-xs">(coming soon)</span>
          </span>
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
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }
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

  const backlogHref = `/dashboard?project=${selectedProject.id}`;
  const boardHref = `/dashboard?project=${selectedProject.id}&view=board`;

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title min-w-0">
            <span className="mr-2 font-mono text-base font-semibold text-gray-400 dark:text-gray-500">
              {selectedProject.abbreviation}
            </span>
            {selectedProject.title}
          </h1>
          <Badge variant={projectStatusVariant(selectedProject.status)}>
            {statusLabel}
          </Badge>
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
        <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {selectedProject.description
            ? stripHtml(selectedProject.description)
            : ''}
        </p>
      </div>

      <section className="mb-10">
        <div
          className={
            isBoardView
              ? 'mx-auto mb-4 flex w-[90%] flex-wrap items-center justify-between gap-4'
              : 'mb-4 flex flex-wrap items-center justify-between gap-4'
          }
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {isBoardView ? 'Board' : 'Backlog'}
            </h2>
            <div className="inline-flex rounded-xl border border-black/[0.06] bg-white/70 p-0.5 dark:border-white/[0.08] dark:bg-dark-high/70">
              <Link
                href={backlogHref}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[0.65rem] px-2.5 py-1 text-xs font-medium transition-colors',
                  !isBoardView
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                <ListIcon size={13} />
                List
              </Link>
              <Link
                href={boardHref}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[0.65rem] px-2.5 py-1 text-xs font-medium transition-colors',
                  isBoardView
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                <LayoutGridIcon size={13} />
                Board
              </Link>
            </div>
          </div>
          <CreateTicketMenu
            projectId={selectedProject.id}
            testId="new-task-button"
          />
        </div>
        {isBoardView ? (
          <TaskBoard tasks={projectTasks} />
        ) : projectTasks.length > 0 ? (
          <TaskTable tasks={projectTasks} />
        ) : (
          <div className="surface-panel flex flex-col items-center justify-center p-8 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-dark-elevated dark:text-gray-500">
              <ListTodoIcon size={24} />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Get started by creating your first task in this project.
            </p>
          </div>
        )}
      </section>

      {!isBoardView && <OrphanedTasksSection tasks={orphanedTasks} />}
    </div>
  );
}
