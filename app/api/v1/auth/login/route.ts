import { handleLogin } from '@/lib/api/auth';

export async function POST(request: Request) {
  return handleLogin(request);
}
