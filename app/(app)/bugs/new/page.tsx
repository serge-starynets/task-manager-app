import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import NewTask from '@/app/components/tasks/NewTask';

export default async function NewBugPage({
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
    <div className="mx-auto flex h-[calc(100dvh-2rem)] w-[91%] flex-col overflow-hidden md:h-[calc(100dvh-4rem)]">
      <Link
        href={backHref}
        className="mb-6 inline-flex shrink-0 items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="mb-6 shrink-0 text-2xl font-bold">
        {projectId ? 'Create New Bug' : 'Create Bug'}
      </h1>
      {!projectId && (
        <p className="mb-6 shrink-0 text-sm text-gray-500 dark:text-gray-400">
          This bug will not be assigned to a project.
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-dark-border-default dark:bg-dark-high dark:shadow-none">
        <Suspense fallback={<div className="p-6 md:p-8">Loading...</div>}>
          <NewTask projectId={projectId} ticketType="bug" />
        </Suspense>
      </div>
    </div>
  );
}
