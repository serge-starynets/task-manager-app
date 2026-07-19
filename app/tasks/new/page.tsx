import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import NewTask from '@/app/components/NewTask';

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const parsedProjectId = project ? parseInt(project, 10) : undefined;
  const projectId =
    parsedProjectId !== undefined && !Number.isNaN(parsedProjectId)
      ? parsedProjectId
      : undefined;

  const backHref = projectId
    ? `/dashboard?project=${projectId}`
    : '/dashboard';

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6">
        {projectId ? 'Create New Task' : 'Create Task'}
      </h1>
      {!projectId && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This task will not be assigned to a project.
        </p>
      )}

      <div className="bg-white dark:bg-dark-elevated border border-gray-200 dark:border-dark-border-default rounded-lg shadow-sm p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <NewTask projectId={projectId} />
        </Suspense>
      </div>
    </div>
  );
}
