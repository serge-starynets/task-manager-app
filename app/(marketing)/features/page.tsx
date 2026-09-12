import React from 'react';
import {
  FolderKanbanIcon,
  LayersIcon,
  Link2Icon,
  ListTodoIcon,
  PaperclipIcon,
  SparklesIcon,
} from 'lucide-react';
import { FeatureCard } from './Cards';

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
          Product
        </p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Features
        </h1>
        <p className="text-lg text-pretty text-gray-500 dark:text-gray-400">
          Projenda gives you the essential tools to plan and track small
          personal projects—without the complexity of team-focused software.
        </p>
      </div>

      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          icon={ListTodoIcon}
          title="Simple Task Tracking"
          description="Create tasks, set priorities, and move work through clear statuses from backlog to completion."
        />
        <FeatureCard
          icon={FolderKanbanIcon}
          title="Personal Projects"
          description="Group tasks into focused projects, or keep standalone tasks for ideas and one-off work."
        />
        <FeatureCard
          icon={LayersIcon}
          title="List and Board Views"
          description="Review your backlog in a compact list or use the visual board to move active tasks through your workflow."
        />
        <FeatureCard
          icon={PaperclipIcon}
          title="Rich Task Details"
          description="Add formatted descriptions, images, and file attachments so the information you need stays with each task."
        />
        <FeatureCard
          icon={Link2Icon}
          title="Related Tasks"
          description="Connect related tasks within a project to keep dependencies and supporting work easy to find."
        />
        <FeatureCard
          icon={SparklesIcon}
          title="Focused and Intuitive"
          description="A clean, responsive interface with light and dark themes keeps planning simple and distractions minimal."
        />
      </div>
    </div>
  );
}
