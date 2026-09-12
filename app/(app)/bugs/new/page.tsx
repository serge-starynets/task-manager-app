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
    <div className="mx-auto flex min-h-0 w-[91%] flex-1 flex-col overflow-hidden">
      <Link
        href={backHref}
        className="back-link mb-6 shrink-0"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="page-title mb-6 shrink-0">
        {projectId ? 'Create New Bug' : 'Create Bug'}
      </h1>
      {!projectId && (
        <p className="mb-6 shrink-0 text-sm text-gray-500 dark:text-gray-400">
          This bug will not be assigned to a project.
        </p>
      )}

      <div className="surface-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<div className="p-6 md:p-8">Loading...</div>}>
          <NewTask projectId={projectId} ticketType="bug" />
        </Suspense>
      </div>
    </div>
  );
}
