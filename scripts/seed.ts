import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { tasks, projects, users } from '../db/schema';
import { allocateTaskId } from '../lib/task-id';

function assertSafeToSeed() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.error(
      'Refusing to seed: this script wipes all data and must never run against production.',
    );
    process.exit(1);
  }

  if (!process.env.LOCAL_DATABASE_URL) {
    console.error(
      'Refusing to seed: LOCAL_DATABASE_URL is not set. Seeding only targets the local database.',
    );
    process.exit(1);
  }

  const confirmed =
    process.argv.includes('--force') || process.env.SEED_FORCE === '1';
  if (!confirmed) {
    console.error(
      'This script DELETES all tasks, projects, and users before seeding.\n' +
        'Re-run with --force (npm run seed -- --force) or SEED_FORCE=1 to confirm.',
    );
    process.exit(1);
  }
}

async function main() {
  assertSafeToSeed();

  console.log('Starting database seeding...');

  // Clean up existing data (order matters for FKs)
  await db.delete(tasks);
  await db.delete(projects);
  await db.delete(users);

  // Create demo users
  const demoPassword = await hash('password123', 10);

  const adminUserId = uuidv4();
  const memberUserId = uuidv4();

  const adminUser = await db
    .insert(users)
    .values({
      id: adminUserId,
      email: 'admin@example.com',
      password: demoPassword,
      role: 'admin',
    })
    .returning()
    .then((rows) => rows[0]);

  const memberUser = await db
    .insert(users)
    .values({
      id: memberUserId,
      email: 'user@example.com',
      password: demoPassword,
      role: 'user',
    })
    .returning()
    .then((rows) => rows[0]);

  console.log('Created demo users:');
  console.log(
    `- Admin: ${adminUser.email} (role: ${adminUser.role}, password: password123)`,
  );
  console.log(
    `- User: ${memberUser.email} (role: ${memberUser.role}, password: password123)`,
  );

  const [adminProject] = await db
    .insert(projects)
    .values({
      title: 'Platform Launch',
      abbreviation: 'PLAT',
      description: 'Core work for the task manager launch',
      status: 'ongoing',
      userId: adminUserId,
    })
    .returning();

  const [memberProject] = await db
    .insert(projects)
    .values({
      title: 'Personal Tasks',
      abbreviation: 'PERS',
      description: 'Day-to-day work items',
      status: 'not_started',
      userId: memberUserId,
    })
    .returning();

  console.log('Created demo projects:');
  console.log(`- ${adminProject.title} [${adminProject.abbreviation}] (admin)`);
  console.log(
    `- ${memberProject.title} [${memberProject.abbreviation}] (user)`,
  );

  // Create demo tasks (one left orphaned intentionally)
  const demoTasks = [
    {
      title: 'Implement user authentication',
      description:
        'Set up NextAuth.js for user authentication and create signin/signup pages.',
      priority: 'high',
      status: 'done',
      type: 'task' as const,
      severity: null,
      userId: adminUserId,
      projectId: adminProject.id,
    },
    {
      title: 'Design landing page',
      description:
        'Create a modern landing page with Tailwind CSS that explains the app features.',
      priority: 'medium',
      status: 'in_progress',
      type: 'task' as const,
      severity: null,
      userId: adminUserId,
      projectId: adminProject.id,
    },
    {
      title: 'Add dark mode support',
      description:
        'Implement dark mode toggle and ensure UI looks good in both themes.',
      priority: 'low',
      status: 'todo',
      type: 'task' as const,
      severity: null,
      userId: memberUserId,
      projectId: memberProject.id,
    },
    {
      title: 'Create task management API',
      description:
        'Build RESTful API endpoints for creating, updating and deleting tasks.',
      priority: 'high',
      status: 'done',
      type: 'task' as const,
      severity: null,
      userId: memberUserId,
      projectId: memberProject.id,
    },
    {
      title: 'Implement drag and drop for tasks',
      description:
        'Add drag and drop functionality to move tasks between status columns.',
      priority: 'medium',
      status: 'todo',
      type: 'task' as const,
      severity: null,
      userId: adminUserId,
      projectId: null,
    },
    {
      title: 'Sign-in form submits twice',
      description:
        'Clicking Sign in quickly can create duplicate session requests.',
      priority: 'high',
      status: 'todo',
      type: 'bug' as const,
      severity: 'high' as const,
      userId: adminUserId,
      projectId: adminProject.id,
    },
    {
      title: 'Orphaned timestamps render in UTC',
      description: 'Tasks without a project show UTC instead of local time.',
      priority: 'medium',
      status: 'backlog',
      type: 'bug' as const,
      severity: 'medium' as const,
      userId: memberUserId,
      projectId: null,
    },
  ];

  for (const task of demoTasks) {
    const taskId = await allocateTaskId(task.projectId, task.userId);
    await db.insert(tasks).values({
      taskId,
      title: task.title,
      description: task.description,
      priority: task.priority as 'low' | 'medium' | 'high' | 'critical',
      status: task.status as
        | 'backlog'
        | 'todo'
        | 'in_progress'
        | 'qa'
        | 'done'
        | 'rejected'
        | 'closed',
      type: task.type,
      severity: task.severity,
      userId: task.userId,
      projectId: task.projectId,
    });
    console.log(`  - ${taskId}: ${task.title}`);
  }

  console.log(`Created ${demoTasks.length} demo tasks`);
  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Seed script finished');
  });
