import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProjectForm from '@/app/components/projects/ProjectForm';
import { countUserProjects, getCurrentUser } from '@/lib/dal';

export default async function NewProjectPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }
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

      <div className="bg-white dark:bg-dark-high border border-gray-200/80 dark:border-dark-border-default rounded-xl shadow-soft dark:shadow-none p-6">
        <ProjectForm />
      </div>
    </div>
  );
}
