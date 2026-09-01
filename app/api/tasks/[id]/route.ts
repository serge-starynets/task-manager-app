import { NextRequest, NextResponse } from 'next/server';
import {
  GET as getTaskV1,
  DELETE as deleteTaskV1,
} from '@/lib/api/task-by-id';

const DEPRECATION =
  'Unversioned API is deprecated; use /api/v1/tasks/{id} instead.';

function withDeprecation(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('Deprecation', 'true');
  headers.set('Link', '</api/v1/tasks>; rel="successor-version"');
  headers.set('X-Api-Warning', DEPRECATION);
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => withDeprecation(await getTaskV1(request, context));

export const DELETE = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => withDeprecation(await deleteTaskV1(request, context));
