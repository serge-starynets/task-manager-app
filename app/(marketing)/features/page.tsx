import React from 'react';
import { FeatureCard } from './Cards';

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 text-gray-500 dark:text-white">
          Features
        </h1>
        <p className="text-xl text-gray-400">
          Projenda gives you the essential tools to plan and track small
          personal projects—without the complexity of team-focused software.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <FeatureCard
          title="Simple Task Tracking"
          description="Create tasks, set priorities, and move work through clear statuses from backlog to completion."
        />
        <FeatureCard
          title="Personal Projects"
          description="Group tasks into focused projects, or keep standalone tasks for ideas and one-off work."
        />
        <FeatureCard
          title="List and Board Views"
          description="Review your backlog in a compact list or use the visual board to move active tasks through your workflow."
        />
        <FeatureCard
          title="Rich Task Details"
          description="Add formatted descriptions, images, and file attachments so the information you need stays with each task."
        />
        <FeatureCard
          title="Related Tasks"
          description="Connect related tasks within a project to keep dependencies and supporting work easy to find."
        />
        <FeatureCard
          title="Focused and Intuitive"
          description="A clean, responsive interface with light and dark themes keeps planning simple and distractions minimal."
        />
      </div>
    </div>
  );
}
