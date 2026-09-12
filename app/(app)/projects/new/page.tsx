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
        className="back-link mb-6"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="page-title mb-6">Create Project</h1>

      <div className="surface-panel p-6">
        <ProjectForm />
      </div>
    </div>
  );
}
