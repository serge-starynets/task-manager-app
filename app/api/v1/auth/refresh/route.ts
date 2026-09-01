import { handleRefresh } from '@/lib/api/auth';

export async function POST(request: Request) {
  return handleRefresh(request);
}
