import { getAccessibleProject } from '@/lib/dal';
import ProjectForm from '@/app/components/projects/ProjectForm';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await getAccessibleProject(parseInt(id));

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link
        href={`/dashboard?project=${id}`}
        className="back-link mb-6"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Project
      </Link>

      <h1 className="page-title mb-6">Edit Project</h1>

      <div className="surface-panel p-6">
        <ProjectForm project={project} isEditing />
      </div>
    </div>
  );
}
