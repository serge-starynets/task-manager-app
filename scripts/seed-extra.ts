import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { tasks, projects, users } from '../db/schema';

const STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'done',
  'rejected',
  'closed',
] as const;

const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

const TASK_TEMPLATES = [
  {
    title: 'Draft product requirements',
    description:
      'Write a clear PRD covering goals, scope, and success metrics for the next release.',
  },
  {
    title: 'Review API error handling',
    description:
      'Audit endpoints for consistent error responses and add missing validation messages.',
  },
  {
    title: 'Improve dashboard loading state',
    description:
      'Add skeleton placeholders so the dashboard feels responsive while data loads.',
  },
  {
    title: 'Write onboarding checklist',
    description:
      'Document first-week setup steps for new teammates joining the project.',
  },
  {
    title: 'Fix timezone display bug',
    description:
      'Ensure timestamps render in the user local timezone across list and detail views.',
  },
  {
    title: 'Add empty-state illustrations',
    description:
      'Design and implement empty states for projects and tasks with a clear call to action.',
  },
  {
    title: 'Optimize database queries',
    description:
      'Profile slow list queries and add indexes or select projections where needed.',
  },
  {
    title: 'Create accessibility pass',
    description:
      'Check keyboard navigation, focus order, and ARIA labels on primary workflows.',
  },
  {
    title: 'Update status badge colors',
    description:
      'Align status badge styles with the design system for light and dark themes.',
  },
  {
    title: 'Prepare release notes',
    description:
      'Summarize shipped features, fixes, and known issues for the upcoming release.',
  },
  {
    title: 'Set up monitoring alerts',
    description:
      'Configure alerts for elevated error rates and failed background jobs.',
  },
  {
    title: 'Refactor form validation',
    description:
      'Centralize shared validation rules and surface field-level errors consistently.',
  },
  {
    title: 'Add project archive flow',
    description:
      'Allow users to archive completed projects without deleting historical tasks.',
  },
  {
    title: 'Investigate flaky tests',
    description:
      'Reproduce intermittent dashboard test failures and stabilize the suite.',
  },
  {
    title: 'Document environment variables',
    description:
      'List required env vars for local, preview, and production with short descriptions.',
  },
  {
    title: 'Improve search relevance',
    description:
      'Tune task search to prioritize title matches and recent updates.',
  },
  {
    title: 'Build notification preferences',
    description:
      'Let users choose which task and project events trigger email notifications.',
  },
  {
    title: 'Clean up unused components',
    description:
      'Remove dead UI components and consolidate duplicated button variants.',
  },
  {
    title: 'Add CSV export for tasks',
    description:
      'Export filtered task lists to CSV including status, priority, and timestamps.',
  },
  {
    title: 'Plan mobile layout polish',
    description:
      'Identify cramped layouts on small screens and propose responsive adjustments.',
  },
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildTask(
  index: number,
  userId: string,
  projectId: number | null,
  prefix: string,
) {
  const template = TASK_TEMPLATES[index % TASK_TEMPLATES.length];

  const now = new Date();

  return {
    title: `${prefix}: ${template.title} #${index + 1}`,
    description: template.description,
    status: pick(STATUSES),
    priority: pick(PRIORITIES),
    userId,
    projectId,
    createdAt: now,
    updatedAt: now,
  };
}

async function main() {
  console.log('Seeding extra projects and tasks (existing data kept)...');

  const emailArg = process.argv[2];
  const [user] = emailArg
    ? await db.select().from(users).where(eq(users.email, emailArg)).limit(1)
    : await db.select().from(users).limit(1);

  if (!user) {
    throw new Error(
      emailArg
        ? `No user found with email: ${emailArg}`
        : 'No users found. Create a user first, then re-run this script.',
    );
  }

  console.log(`Using user: ${user.email} (${user.id})`);

  const projectDefs = [
    {
      title: 'Website Redesign',
      description:
        'Refresh marketing pages, improve navigation, and modernize the visual system.',
      status: 'ongoing' as const,
      taskPrefix: 'Website',
    },
    {
      title: 'Mobile App MVP',
      description:
        'Ship a first version of the mobile experience with core task workflows.',
      status: 'not_started' as const,
      taskPrefix: 'Mobile',
    },
  ];

  const createdProjects = [];

  const now = new Date();

  for (const projectDef of projectDefs) {
    const [project] = await db
      .insert(projects)
      .values({
        title: projectDef.title,
        description: projectDef.description,
        status: projectDef.status,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    createdProjects.push({ ...project, taskPrefix: projectDef.taskPrefix });
    console.log(`Created project: ${project.title} (id: ${project.id})`);
  }

  const projectTasks = createdProjects.flatMap((project) =>
    Array.from({ length: 20 }, (_, index) =>
      buildTask(index, user.id, project.id, project.taskPrefix),
    ),
  );

  const orphanedTasks = Array.from({ length: 10 }, (_, index) =>
    buildTask(index, user.id, null, 'Standalone'),
  );

  const allTasks = [...projectTasks, ...orphanedTasks];

  await db.insert(tasks).values(allTasks);

  console.log(
    `Created ${createdProjects.length} projects, ${projectTasks.length} project tasks, and ${orphanedTasks.length} orphaned tasks.`,
  );
  console.log('Extra seeding completed!');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
