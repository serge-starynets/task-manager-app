import TaskForm from './TaskForm';
import { getAccessibleProject, requireUser } from '@/lib/dal';
import { redirect } from 'next/navigation';

const NewTask = async ({ projectId }: { projectId?: number }) => {
  const user = await requireUser();

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
