import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCurrentUser, canManageTask } from '@/lib/dal';

type RouteContext = {
  params: Promise<{ pathname: string[] }>;
};

function decodePath(segments: string[]): string {
  return segments.map((s) => decodeURIComponent(s)).join('/');
}

async function canAccessPathname(
  pathname: string,
  userId: string,
): Promise<boolean> {
  const taskMatch = pathname.match(/^tasks\/(\d+)\//);
  if (taskMatch) {
    const taskId = Number(taskMatch[1]);
    return canManageTask(taskId);
  }

  const draftMatch = pathname.match(/^drafts\/([^/]+)\//);
  if (draftMatch) {
    return draftMatch[1] === userId;
  }

  return false;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pathname: segments } = await context.params;
  if (!segments?.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const pathname = decodePath(segments);
  if (pathname.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const allowed = await canAccessPathname(pathname, user.id);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await get(pathname, { access: 'private' });
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      'Content-Type',
      result.blob.contentType || 'application/octet-stream',
    );
    headers.set(
      'Content-Disposition',
      result.blob.contentDisposition || 'inline',
    );
    headers.set('Cache-Control', 'private, max-age=3600');

    return new NextResponse(result.stream, { status: 200, headers });
  } catch (error) {
    console.error('Error streaming attachment:', pathname, error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
