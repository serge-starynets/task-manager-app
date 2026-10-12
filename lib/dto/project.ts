import type { ProjectStatus, ProjectType } from '@/lib/validations/project';

export type ProjectDto = {
  id: number;
  title: string;
  abbreviation: string;
  description: string | null;
  status: ProjectStatus;
  type: ProjectType;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
