'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { countUserProjects, getCurrentUser } from '@/lib/dal';
import {
  isAbbreviationTaken,
  isUniqueViolation,
  normalizeAbbreviation,
} from '@/lib/project-abbreviation';
import { sanitizeRichText } from '@/lib/rich-text';
import { z } from 'zod';

const MAX_PROJECTS_PER_USER = 10;

const ProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  abbreviation: z
    .string()
    .trim()
    .min(1, 'Abbreviation is required')
    .max(8, 'Abbreviation must be at most 8 characters')
    .regex(/^[A-Za-z]+$/, 'Abbreviation may only contain latin letters'),
  description: z.string().optional().nullable(),
  status: z.enum(['not_started', 'ongoing', 'completed'], {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),
});

export type ProjectData = z.infer<typeof ProjectSchema>;

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

    const projectCount = await countUserProjects(user.id);
    if (projectCount >= MAX_PROJECTS_PER_USER) {
      return {
        success: false,
        message: `You can have at most ${MAX_PROJECTS_PER_USER} projects`,
        error: 'Project limit reached',
      };
    }

    const validationResult = ProjectSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const validatedData = validationResult.data;
    const abbreviation = normalizeAbbreviation(validatedData.abbreviation);

    if (!abbreviation) {
      return {
        success: false,
        message: 'Validation failed',
        errors: {
          abbreviation: ['Abbreviation may only contain latin letters (A–Z)'],
        },
      };
    }

    if (await isAbbreviationTaken(user.id, abbreviation)) {
      return {
        success: false,
        message: 'Validation failed',
        errors: {
          abbreviation: ['This abbreviation is already used by another project'],
        },
      };
    }

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

    revalidateTag('projects');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Project created successfully',
      projectId: created.id,
    };
  } catch (error) {
    console.error('Error creating project:', error);

    if (isUniqueViolation(error)) {
      return {
        success: false,
        message: 'Validation failed',
        errors: {
          abbreviation: ['This abbreviation is already used by another project'],
        },
      };
    }

    return {
      success: false,
      message: 'An error occurred while creating the project',
      error: 'Failed to create project',
    };
  }
}
