'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { canManageTask, getCurrentUser, getProject, isAdmin } from '@/lib/dal';
import { z } from 'zod';

const TaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),

  description: z.string().optional().nullable(),

  status: z.enum(
    ['backlog', 'todo', 'in_progress', 'done', 'rejected', 'closed'],
    {
      errorMap: () => ({ message: 'Please select a valid status' }),
    },
  ),

  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'Please select a valid priority' }),
  }),
  userId: z.string().min(1, 'User ID is required'),
  projectId: z.number().int().positive().optional().nullable(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
});

export type TaskData = z.infer<typeof TaskSchema>;

export type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
  projectId?: number | null;
};

export async function createTask(data: TaskData): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Unauthorized',
      };
    }

    const timestamp = Date.now();
    const createdDate = new Date(timestamp);

    const newTaskData = {
      ...data,
      userId: user.id,
      createdAt: createdDate,
      projectId: data.projectId ?? null,
    };

    const validationResult = TaskSchema.safeParse(newTaskData);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const validatedData = validationResult.data;
    const projectId: number | null = validatedData.projectId ?? null;

    if (projectId !== null) {
      const project = await getProject(projectId);
      if (!project || project.userId !== user.id) {
        return {
          success: false,
          message: 'Invalid project',
          error: 'Forbidden',
          errors: { projectId: ['Please select a valid project'] },
        };
      }
    }

    await db.insert(tasks).values({
      title: validatedData.title,
      description: validatedData.description || null,
      status: validatedData.status,
      priority: validatedData.priority,
      userId: validatedData.userId,
      projectId,
      createdAt: validatedData.createdAt,
    });
    revalidateTag('tasks');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return {
      success: true,
      message: 'Task created successfully',
      projectId,
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      success: false,
      message: 'An error occurred while creating the task',
      error: 'Failed to create task',
    };
  }
}

export async function updateTask(
  id: number,
  data: Partial<TaskData>,
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Unauthorized',
      };
    }

    const canManage = await canManageTask(id);
    if (!canManage) {
      return {
        success: false,
        message: 'You do not have permission to update this task',
        error: 'Forbidden',
      };
    }

    const timestamp = Date.now();
    const updatedDate = new Date(timestamp);

    const newData = {
      ...data,
      updatedAt: updatedDate,
    };

    const UpdateTaskSchema = TaskSchema.partial();
    const validationResult = UpdateTaskSchema.safeParse(newData);

    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const validatedData = validationResult.data;
    const updateData: Record<string, unknown> = {};

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority;
    if (validatedData.userId !== undefined && isAdmin(user)) {
      updateData.userId = validatedData.userId;
    }
    updateData.updatedAt = validatedData.updatedAt;

    await db.update(tasks).set(updateData).where(eq(tasks.id, id));
    revalidateTag('tasks');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return { success: true, message: 'Task updated successfully' };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      success: false,
      message: 'An error occurred while updating the task',
      error: 'Failed to update task',
    };
  }
}

export async function deleteTask(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const canManage = await canManageTask(id);
    if (!canManage) {
      return {
        success: false,
        message: 'An error occurred while deleting the task.',
        error: 'Failed to delete task of another user',
      };
    }

    await db.delete(tasks).where(eq(tasks.id, id));

    revalidateTag('tasks');
    revalidatePath('/dashboard');
    revalidatePath('/tasks', 'layout');

    return { success: true, message: 'Task deleted successfully' };
  } catch (error) {
    console.error('Error deleting task:', error);
    return {
      success: false,
      message: 'An error occurred while deleting the task',
      error: 'Failed to delete task',
    };
  }
}
