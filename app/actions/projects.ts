'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/dal';
import {
  createProjectForUser,
  updateProjectForUser,
} from '@/lib/services/project-service';
import { forbiddenOrMessage } from '@/lib/actions/helpers';
import type { ProjectData } from '@/lib/validations/project';

export type { ProjectData } from '@/lib/validations/project';

export type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
  projectId?: number;
};

export async function createProject(
  data: ProjectData,
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

    const result = await createProjectForUser(user, data);
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        errors: result.errors,
        error: forbiddenOrMessage(result.status, result.message),
      };
    }

    revalidateTag('projects', 'max');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Project created successfully',
      projectId: result.data.id,
    };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      success: false,
      message: 'An error occurred while creating the project',
      error: 'Failed to create project',
    };
  }
}

export async function updateProject(
  id: number,
  data: Partial<ProjectData>,
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

    const result = await updateProjectForUser(user, id, data);
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        errors: result.errors,
        error: forbiddenOrMessage(result.status, result.message),
      };
    }

    revalidateTag('projects', 'max');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Project updated successfully',
      projectId: id,
    };
  } catch (error) {
    console.error('Error updating project:', error);
    return {
      success: false,
      message: 'An error occurred while updating the project',
      error: 'Failed to update project',
    };
  }
}
