import { db } from '@/db';
import { issues } from '@/db/schema';
import { canManageIssue, getCurrentUser, getIssue, isAdmin } from '@/lib/dal';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const issue = await getIssue(parseInt(id));

    if (!issue || (!isAdmin(user) && issue.userId !== user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: issue });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'not here' }, { status: 404 });
  }
};

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const issueId = parseInt(id);
    const canManage = await canManageIssue(issueId);

    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(issues).where(eq(issues.id, issueId));

    return NextResponse.json({ message: 'Issue deleted successfully' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
};
