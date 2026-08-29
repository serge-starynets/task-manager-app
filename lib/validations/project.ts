import { z } from 'zod';

export const MAX_PROJECTS_PER_USER = 10;

export const PROJECT_STATUSES = [
  'not_started',
  'ongoing',
  'completed',
  'paused',
] as const;

export const ProjectStatusSchema = z.enum(PROJECT_STATUSES, {
  errorMap: () => ({ message: 'Please select a valid status' }),
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be less than 100 characters'),
  abbreviation: z
    .string()
    .trim()
    .min(1, 'Abbreviation is required')
    .max(8, 'Abbreviation must be at most 8 characters')
    .regex(/^[A-Za-z]+$/, 'Abbreviation may only contain latin letters'),
  description: z.string().optional().nullable(),
  status: ProjectStatusSchema,
});

export type ProjectData = z.infer<typeof ProjectSchema>;

export const UpdateProjectSchema = ProjectSchema.omit({
  abbreviation: true,
}).partial();
