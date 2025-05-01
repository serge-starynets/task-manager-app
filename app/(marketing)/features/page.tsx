import React from 'react';
import { FeatureCard, PlanCard } from './Cards';

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 text-white">Features</h1>
        <p className="text-xl text-gray-400">
          Discover how Linear Clone can help you manage your projects more
          efficiently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <FeatureCard
          title="Issue Tracking"
          description="Create, assign, and track issues with ease. Set priorities, due dates, and statuses to keep your team on track."
        />
        <FeatureCard
          title="Intuitive UI"
          description="A clean, modern interface that makes project management a breeze. No clutter, just what you need to get work done."
        />
        <FeatureCard
          title="Collaboration"
          description="Work together seamlessly. Comment on issues, mention team members, and keep everyone in the loop."
        />
        <FeatureCard
          title="Custom Workflows"
          description="Create workflows that match your team's process. Customize statuses, labels, and more."
        />
        <FeatureCard
          title="Real-time Updates"
          description="See changes as they happen. No need to refresh or wait for updates."
        />
        <FeatureCard
          title="Powerful Search"
          description="Find anything instantly with our powerful search. Filter by assignee, status, priority, and more."
        />
      </div>
    </div>
  );
}
