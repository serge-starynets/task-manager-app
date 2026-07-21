import {
  getTasksForProject,
  getOrphanedTasks,
  getProjects,
  requireUser,
} from '@/lib/dal';
import { stripHtml } from '@/lib/rich-text';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Button from '../components/ui/Button';
import { PlusIcon } from 'lucide-react';
import TaskTable from '../components/TaskTable';
import { PROJECT_STATUS } from '@/db/schema';

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await requireUser();
  const { project: projectParam } = await searchParams;
  const projects = await getProjects(user.id);
  const orphanedTasks = await getOrphanedTasks(user.id);

  if (projects.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-12 text-center border border-gray-200 dark:border-dark-border-default rounded-lg bg-white dark:bg-dark-high p-8">
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create a project to organize tasks, or add a task without a project
            from the sidebar.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/projects/new">
              <Button>
                <span className="flex items-center">
                  <PlusIcon size={18} className="mr-2" />
                  Create Project
                </span>
              </Button>
            </Link>
          </div>
        </div>

        <OrphanedTasksSection tasks={orphanedTasks} />
      </div>
    );
  }

  const selectedProjectId = projectParam ? parseInt(projectParam, 10) : NaN;
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (!selectedProject) {
    redirect(`/dashboard?project=${projects[0].id}`);
  }

  const projectTasks = await getTasksForProject(user.id, selectedProject.id);

  const statusLabel =
    PROJECT_STATUS[selectedProject.status as keyof typeof PROJECT_STATUS]
      ?.label ?? selectedProject.status;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
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
