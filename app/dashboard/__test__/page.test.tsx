import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../page';
import {
  getTasksForProject,
  getOrphanedTasks,
  getProjects,
  requireUser,
} from '@/lib/dal';
import { TASK_STATUS, TASK_PRIORITY } from '@/db/schema';
import { Status, Priority } from '@/lib/types';

const mockUser = {
  id: 'user1',
  email: 'user1@example.com',
  password: 'hashed-password',
  role: 'user' as const,
  createdAt: new Date(),
};

const mockProject = {
  id: 1,
  title: 'Test Project',
  abbreviation: 'TEST',
  description: 'A test project',
  status: 'ongoing' as const,
  userId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock('@/lib/dal', () => ({
  getTasks: vi.fn(),
  getTasksForProject: vi.fn(),
  getOrphanedTasks: vi.fn(),
  getProjects: vi.fn(),
  getCurrentUser: vi.fn(),
  requireUser: vi.fn(),
  isAdmin: (user: { role: string }) => user.role === 'admin',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  ),
}));

vi.mock('@/lib/utils', () => ({
  formatRelativeTime: vi.fn(() => '2 days ago'),
  cn: vi.fn((...args) => args.join(' ')),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/app/components/ThemeToggler', () => ({
  default: () => <button type="button">Theme</button>,
}));

vi.mock('@/app/components/SignOutButton', () => ({
  default: () => <button type="button">Sign Out</button>,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue(mockUser);
    vi.mocked(getOrphanedTasks).mockResolvedValue([]);
  });

  it('renders the tasks list when tasks are available for a project', async () => {
    const mockTasks = [
      {
        id: 1,
        taskId: 'TEST-1',
        title: 'Test Task 1',
        description: 'Test description',
        status: 'todo' as Status,
        priority: 'medium' as Priority,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        projectId: 1,
        user: {
          id: 'user1',
          email: 'user1@example.com',
          password: 'hashed-password',
          role: 'user' as const,
          createdAt: new Date(),
        },
      },
      {
        id: 2,
        taskId: 'TEST-2',
        title: 'Test Task 2',
        description: null,
        status: 'in_progress' as Status,
        priority: 'high' as Priority,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        projectId: 1,
        user: {
          id: 'user1',
          email: 'user1@example.com',
          password: 'hashed-password',
          role: 'user' as const,
          createdAt: new Date(),
        },
      },
    ];

    vi.mocked(getProjects).mockResolvedValue([mockProject]);
    vi.mocked(getTasksForProject).mockResolvedValue(mockTasks);

    const Component = await DashboardPage({
      searchParams: Promise.resolve({ project: '1' }),
    });
    render(Component);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText(TASK_STATUS.todo.label)).toBeInTheDocument();
    expect(
      screen.getByText(TASK_STATUS.in_progress.label),
    ).toBeInTheDocument();
    expect(screen.getByText(TASK_PRIORITY.medium.label)).toBeInTheDocument();
    expect(screen.getByText(TASK_PRIORITY.high.label)).toBeInTheDocument();
    expect(screen.getAllByText('2 days ago')).toHaveLength(4);
  });

  it('renders empty project state on home when user has no projects', async () => {
    vi.mocked(getProjects).mockResolvedValue([]);

    const Component = await DashboardPage({
      searchParams: Promise.resolve({}),
    });
    render(Component);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create a project to organize your tasks.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders project list on home without redirecting', async () => {
    const secondProject = {
      ...mockProject,
      id: 2,
      title: 'Second Project',
      abbreviation: 'SEC',
    };
    vi.mocked(getProjects).mockResolvedValue([mockProject, secondProject]);

    const Component = await DashboardPage({
      searchParams: Promise.resolve({}),
    });
    render(Component);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Second Project')).toBeInTheDocument();
    expect(screen.getByText('TEST')).toBeInTheDocument();
    expect(screen.getByText('SEC')).toBeInTheDocument();

    const links = screen.getAllByTestId('next-link');
    const projectHrefs = links.map((el) => el.getAttribute('href'));
    expect(projectHrefs).toContain('/dashboard?project=1');
    expect(projectHrefs).toContain('/dashboard?project=2');
    expect(getTasksForProject).not.toHaveBeenCalled();
  });

  it('renders the empty tasks state when project has no tasks', async () => {
    vi.mocked(getProjects).mockResolvedValue([mockProject]);
    vi.mocked(getTasksForProject).mockResolvedValue([]);

    const Component = await DashboardPage({
      searchParams: Promise.resolve({ project: '1' }),
    });
    render(Component);

    expect(screen.getByText('No tasks found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Get started by creating your first task in this project.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('new-task-button')).toBeInTheDocument();
  });

  it('navigates to new task page with project when clicking New Task', async () => {
    vi.mocked(getProjects).mockResolvedValue([mockProject]);
    vi.mocked(getTasksForProject).mockResolvedValue([]);

    const Component = await DashboardPage({
      searchParams: Promise.resolve({ project: '1' }),
    });
    render(Component);

    const newTaskButton = screen.getByTestId('new-task-button');
    expect(newTaskButton).toBeInTheDocument();

    const linkElement = newTaskButton.closest('[data-testid="next-link"]');
    expect(linkElement).toHaveAttribute('href', '/tasks/new?project=1');
  });

  it('calls notFound when project param is invalid', async () => {
    vi.mocked(getProjects).mockResolvedValue([mockProject]);

    await expect(
      DashboardPage({
        searchParams: Promise.resolve({ project: '999' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders orphaned tasks section when present on project view', async () => {
    const orphaned = [
      {
        id: 99,
        taskId: 'TASK-1',
        title: 'Orphaned Task',
        description: null,
        status: 'todo' as Status,
        priority: 'low' as Priority,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        projectId: null,
        user: {
          id: 'user1',
          email: 'user1@example.com',
          password: 'hashed-password',
          role: 'user' as const,
          createdAt: new Date(),
        },
      },
    ];

    vi.mocked(getProjects).mockResolvedValue([mockProject]);
    vi.mocked(getTasksForProject).mockResolvedValue([]);
    vi.mocked(getOrphanedTasks).mockResolvedValue(orphaned);

    const Component = await DashboardPage({
      searchParams: Promise.resolve({ project: '1' }),
    });
    render(Component);

    expect(screen.getByText('Tasks without a project')).toBeInTheDocument();
    expect(screen.getByText('Orphaned Task')).toBeInTheDocument();
  });
});
