import { handleMe } from '@/lib/api/auth';

export async function GET() {
  return handleMe();
}
