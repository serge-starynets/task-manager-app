import React from 'react';
import {
  BugIcon,
  FolderKanbanIcon,
  LayersIcon,
  Link2Icon,
  StickyNoteIcon,
  TextCursorInputIcon,
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
        <p className="text-lg text-pretty text-gray-600 dark:text-gray-300">
          Projenda is a lightweight issue tracker for personal projects—tasks,
          bugs, boards, and notes without team software overhead.
        </p>
      </div>

      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          icon={BugIcon}
          title="Tasks and Bugs"
          description="Track work as tasks or bugs with priorities, statuses, optional effort estimates, and severity on bugs. Each ticket gets a readable key like WEB-12."
        />
        <FeatureCard
          icon={FolderKanbanIcon}
          title="Projects That Fit the Work"
          description="Group tickets into projects with a short abbreviation and a type—Software (bugs, QA, closed) or Other (no bugs, on-pause workflow). Standalone tickets work when you do not need a project."
        />
        <FeatureCard
          icon={LayersIcon}
          title="Backlog and Board"
          description="Scan and sort your backlog in a dense list, then drag active tickets across a kanban board—and reorder within a column—when status needs a visual shape."
        />
        <FeatureCard
          icon={TextCursorInputIcon}
          title="Rich Ticket Details"
          description="Write formatted descriptions with images and links, attach files, leave comments, and review field-level change history on every ticket."
        />
        <FeatureCard
          icon={Link2Icon}
          title="Related and Blocked By"
          description="Link tickets inside a project as related work or mark what is blocking you, including links between tasks and bugs."
        />
        <FeatureCard
          icon={StickyNoteIcon}
          title="Paper Notes Board"
          description="Keep short sticky notes on a personal whiteboard—stack them, drag them onto the board, and edit or remove them anytime. Light and dark themes keep the whole app calm."
        />
      </div>
    </div>
  );
}
