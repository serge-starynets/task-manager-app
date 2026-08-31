import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { projects, type Project, type User } from '@/db/schema';
import { countUserProjects, getProject } from '@/lib/dal';
import {
  isAbbreviationTaken,
  isUniqueViolation,
  normalizeAbbreviation,
} from '@/lib/project-abbreviation';
import { sanitizeRichText } from '@/lib/rich-text';
import type { ServiceResult } from '@/lib/services/types';
import {
  MAX_PROJECTS_PER_USER,
  ProjectSchema,
  UpdateProjectSchema,
  type ProjectData,
} from '@/lib/validations/project';

export async function createProjectForUser(
  user: Pick<User, 'id'>,
  data: ProjectData,
): Promise<ServiceResult<Project>> {
  const projectCount = await countUserProjects(user.id);
  if (projectCount >= MAX_PROJECTS_PER_USER) {
    return {
      ok: false,
      status: 400,
      message: `You can have at most ${MAX_PROJECTS_PER_USER} projects`,
    };
  }

  const validationResult = ProjectSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      ok: false,
      status: 400,
      message: 'Validation failed',
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const validatedData = validationResult.data;
  const abbreviation = normalizeAbbreviation(validatedData.abbreviation);

  if (!abbreviation) {
    return {
      ok: false,
      status: 400,
      message: 'Validation failed',
      errors: {
        abbreviation: ['Abbreviation may only contain latin letters (A–Z)'],
      },
    };
  }

  if (await isAbbreviationTaken(user.id, abbreviation)) {
    return {
      ok: false,
      status: 400,
      message: 'Validation failed',
      errors: {
        abbreviation: ['This abbreviation is already used by another project'],
      },
    };
  }

  try {
    const now = new Date();
    const [created] = await db
      .insert(projects)
      .values({
        title: validatedData.title,
        abbreviation,
        description: sanitizeRichText(validatedData.description),
        status: validatedData.status,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        status: 400,
        message: 'Validation failed',
        errors: {
          abbreviation: ['This abbreviation is already used by another project'],
        },
      };
    }
    throw error;
  }
}

export async function updateProjectForUser(
  user: Pick<User, 'id'>,
  projectId: number,
  data: Partial<ProjectData>,
): Promise<ServiceResult<Project>> {
  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to update this project',
    };
  }

  const validationResult = UpdateProjectSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      ok: false,
      status: 400,
      message: 'Validation failed',
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const validatedData = validationResult.data;
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (validatedData.title !== undefined) updateData.title = validatedData.title;
  if (validatedData.description !== undefined) {
    updateData.description = sanitizeRichText(validatedData.description);
  }
  if (validatedData.status !== undefined) updateData.status = validatedData.status;

  const [updated] = await db
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, projectId))
    .returning();

  return { ok: true, data: updated };
}
