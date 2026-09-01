import { NextResponse } from 'next/server';
import { GET as getTasksV1, POST as postTaskV1 } from '@/lib/api/tasks';

const DEPRECATION =
  'Unversioned API is deprecated; use /api/v1/tasks instead.';

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

export async function GET(request: Request) {
  return withDeprecation(await getTasksV1(request));
}

export async function POST(request: Request) {
  return withDeprecation(await postTaskV1(request));
}
