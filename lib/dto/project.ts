import type { ProjectStatus } from '@/lib/validations/project';

export type ProjectDto = {
  id: number;
  title: string;
  abbreviation: string;
  description: string | null;
  status: ProjectStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
