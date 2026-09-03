import { getAccessibleProject, getCurrentUser } from '@/lib/dal';
import { redirect } from 'next/navigation';
import TaskForm from '@/app/components/tasks/TaskForm';
import type { TicketType } from '@/lib/types';

const NewTask = async ({
  projectId,
  ticketType = 'task',
}: {
  projectId?: number;
  ticketType?: TicketType;
}) => {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }

  if (projectId !== undefined) {
    const project = await getAccessibleProject(projectId);
    if (!project) {
      redirect('/dashboard');
    }
    return (
      <TaskForm
        userId={user.id}
        projectId={project.id}
        ticketType={ticketType}
      />
    );
  }

  return <TaskForm userId={user.id} ticketType={ticketType} />;
};

export default NewTask;
