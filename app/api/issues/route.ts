import { NextResponse } from 'next/server';
import { db } from '@/db';
import { issues } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, isAdmin } from '@/lib/dal';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allIssues = await db.query.issues.findMany({
      where: isAdmin(user) ? undefined : eq(issues.userId, user.id),
      with: { user: true },
      orderBy: (issuesTable, { desc }) => [desc(issuesTable.createdAt)],
    });

    return NextResponse.json({ data: allIssues });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create the issue for the authenticated user
    const newIssue = await db
      .insert(issues)
      .values({
        title: data.title,
        description: data.description || null,
        status: data.status || 'backlog',
        priority: data.priority || 'medium',
        userId: user.id,
      })
      .returning();

    return NextResponse.json(
      { message: 'Issue created successfully', issue: newIssue[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating issues:', error);
    return NextResponse.json(
      { error: 'Failed to create issues' },
      { status: 500 },
    );
  }
}
