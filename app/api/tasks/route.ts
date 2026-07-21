import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, getProject, isAdmin } from '@/lib/dal';
import { sanitizeRichText } from '@/lib/rich-text';
import { allocateTaskId } from '@/lib/task-id';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allTasks = await db.query.tasks.findMany({
      where: isAdmin(user) ? undefined : eq(tasks.userId, user.id),
      with: { user: true },
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

    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let projectId: number | null = null;
    if (data.projectId != null && data.projectId !== '') {
      projectId = Number(data.projectId);
      const project = await getProject(projectId);
      if (!project || project.userId !== user.id) {
        return NextResponse.json({ error: 'Invalid project' }, { status: 403 });
      }
    }

    const taskId = await allocateTaskId(projectId, user.id);

    const newTask = await db
      .insert(tasks)
      .values({
        taskId,
        title: data.title,
        description: sanitizeRichText(data.description),
        status: data.status || 'backlog',
        priority: data.priority || 'medium',
        userId: user.id,
        projectId,
      })
      .returning();

    return NextResponse.json(
      { message: 'Task created successfully', task: newTask[0] },
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
