import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProjectForm from '@/app/components/ProjectForm';
import { countUserProjects, requireUser } from '@/lib/dal';

export default async function NewProjectPage() {
  const user = await requireUser();
  const projectCount = await countUserProjects(user.id);

  if (projectCount >= 10) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6">Create Project</h1>

      <div className="bg-white dark:bg-dark-elevated border border-gray-200 dark:border-dark-border-default rounded-lg shadow-sm p-6">
        <ProjectForm />
      </div>
    </div>
  );
}
