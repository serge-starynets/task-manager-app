import { getAccessibleProject, getCurrentUser } from '@/lib/dal';
import { redirect } from 'next/navigation';
import TaskForm from '@/app/components/tasks/TaskForm';

const NewTask = async ({ projectId }: { projectId?: number }) => {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }

  if (projectId !== undefined) {
    const project = await getAccessibleProject(projectId);
    if (!project) {
      redirect('/dashboard');
    }
    return <TaskForm userId={user.id} projectId={project.id} />;
  }

  return <TaskForm userId={user.id} />;
};

export default NewTask;
