import { getCurrentUser } from '@/lib/dal';
import Button from './ui/Button';
import Link from 'next/link';

const DashboardButton = async () => {
  const user = await getCurrentUser();
  return (
    <>
      {user ? (
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      ) : (
        <div className="flex items-center space-x-4">
          <Link href="/app/(auth)/signin">
            <Button variant="outline">Sign in</Button>
          </Link>
          <Link href="/app/(auth)/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      )}
    </>
  );
};

export default DashboardButton;
