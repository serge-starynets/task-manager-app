'use server';

import { getCurrentUser } from '@/lib/dal';
import {
  actionError,
  revalidateProjectViews,
  toActionResponse,
  unauthorizedResponse,
} from '@/lib/actions/helpers';
import {
  createProjectForUser,
  updateProjectForUser,
} from '@/lib/services/project-service';
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
    if (!user) return unauthorizedResponse();

    const result = await createProjectForUser(user, data);
    if (!result.ok) return toActionResponse(result);

    revalidateProjectViews();

    return {
      success: true,
      message: 'Project created successfully',
      projectId: result.data.id,
    };
  } catch (error) {
    console.error('Error creating project:', error);
    return actionError(
      'An error occurred while creating the project',
      'Failed to create project',
    );
  }
}

export async function updateProject(
  id: number,
  data: Partial<ProjectData>,
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await updateProjectForUser(user, id, data);
    if (!result.ok) return toActionResponse(result);

    revalidateProjectViews();

    return {
      success: true,
      message: 'Project updated successfully',
      projectId: id,
    };
  } catch (error) {
    console.error('Error updating project:', error);
    return actionError(
      'An error occurred while updating the project',
      'Failed to update project',
    );
  }
}
