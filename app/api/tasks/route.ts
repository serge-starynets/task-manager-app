import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, isAdmin, PUBLIC_USER_COLUMNS } from '@/lib/dal';
import { createTaskForUser } from '@/lib/services/task-service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allTasks = await db.query.tasks.findMany({
      where: isAdmin(user) ? undefined : eq(tasks.userId, user.id),
      with: { user: { columns: PUBLIC_USER_COLUMNS } },
      orderBy: (tasksTable, { desc }) => [desc(tasksTable.createdAt)],
    });

    return NextResponse.json({ data: allTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    let projectId: number | null = null;
    if (data.projectId != null && data.projectId !== '') {
      projectId = Number(data.projectId);
      if (!Number.isInteger(projectId)) {
        return NextResponse.json({ error: 'Invalid project' }, { status: 400 });
      }
    }

    const result = await createTaskForUser(user, {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      projectId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, errors: result.errors },
        { status: result.status },
      );
    }

    revalidateTag('tasks', 'max');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return NextResponse.json(
      { message: 'Task created successfully', task: result.data },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating tasks:', error);
    return NextResponse.json(
      { error: 'Failed to create tasks' },
      { status: 500 },
    );
  }
}
