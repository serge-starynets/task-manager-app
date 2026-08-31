import { getCurrentUser, getTask, isAdmin } from '@/lib/dal';
import { deleteTaskForUser } from '@/lib/services/task-service';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const task = await getTask(parseInt(id));

    if (!task || (!isAdmin(user) && task.userId !== user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: task });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'not here' }, { status: 404 });
  }
};

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id);

    const result = await deleteTaskForUser(taskId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: result.status },
      );
    }

    revalidateTag('tasks', 'max');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
};
