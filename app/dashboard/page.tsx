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
  PlusIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import TaskTable from '../components/TaskTable';
import { PROJECT_STATUS, type Project, type User } from '@/db/schema';

function OrphanedTasksSection({
  tasks,
}: {
  tasks: Awaited<ReturnType<typeof getOrphanedTasks>>;
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-gray-200 dark:border-dark-border-default">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <ThemeToggle />
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          {canCreateMore && projects.length > 0 && (
            <Link href="/projects/new">
              <Button size="sm">
                <span className="flex items-center">
                  <PlusIcon size={16} className="mr-2" />
                  Create Project
                </span>
              </Button>
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-gray-200 dark:border-dark-border-default rounded-lg bg-white dark:bg-dark-high p-8">
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create a project to organize your tasks.
            </p>
            <Link href="/projects/new">
              <Button>
                <span className="flex items-center">
                  <PlusIcon size={18} className="mr-2" />
                  Create Project
                </span>
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="border border-gray-200 dark:border-dark-border-default rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-dark-border-default bg-white dark:bg-dark-high">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard?project=${project.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors"
                >
                  <FolderIcon
                    size={20}
                    className="shrink-0 text-gray-500 dark:text-gray-400"
                  />
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

      <section className="border border-gray-200 dark:border-dark-border-default rounded-lg bg-white dark:bg-dark-high p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="flex items-start gap-3 mb-4">
          <UserIcon
            size={20}
            className="shrink-0 text-gray-500 dark:text-gray-400 mt-0.5"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium break-words">{user.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
              {isAdmin(user) ? 'Admin' : 'Standard user'}
            </p>
          </div>
        </div>

        <div className="space-y-1 border-t border-gray-200 dark:border-dark-border-default pt-4">
          <span
            aria-disabled="true"
            className="flex items-center w-full px-2 py-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed pointer-events-none select-none"
          >
            <SettingsIcon size={20} className="mr-2" />
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
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await requireUser();
  const { project: projectParam } = await searchParams;
  const projects = await getProjects(user.id);

  if (!projectParam) {
    return <DashboardHome user={user} projects={projects} />;
  }

  const selectedProjectId = parseInt(projectParam, 10);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (!selectedProject) {
    notFound();
  }

  const orphanedTasks = await getOrphanedTasks(user.id);
  const projectTasks = await getTasksForProject(user.id, selectedProject.id);

  const statusLabel =
    PROJECT_STATUS[selectedProject.status as keyof typeof PROJECT_STATUS]
      ?.label ?? selectedProject.status;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">
            <span className="text-gray-500 dark:text-gray-400 font-semibold mr-2">
              {selectedProject.abbreviation}
            </span>
            {selectedProject.title}
          </h1>
          <h4 className="text-m font-bold italic text-gray-500 dark:text-gray-400">
            {statusLabel}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {selectedProject.description
              ? stripHtml(selectedProject.description)
              : ''}
          </p>
        </div>
        <Link
          href={`/projects/${selectedProject.id}/edit`}
          className="shrink-0"
        >
          <Button variant="outline" size="sm">
            <span className="flex items-center">
              <Edit2Icon size={16} className="mr-1" />
              Edit
            </span>
          </Button>
        </Link>
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Project tasks</h2>
          <Link href={`/tasks/new?project=${selectedProject.id}`}>
            <Button data-testid="new-task-button" size="sm">
              <span className="flex items-center">
                <PlusIcon size={16} className="mr-2" />
                New Task
              </span>
            </Button>
          </Link>
        </div>
        {projectTasks.length > 0 ? (
          <TaskTable tasks={projectTasks} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-gray-200 dark:border-dark-border-default rounded-lg bg-white dark:bg-dark-high p-8">
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Get started by creating your first task in this project.
            </p>
          </div>
        )}
      </section>

      <OrphanedTasksSection tasks={orphanedTasks} />
    </div>
  );
}
