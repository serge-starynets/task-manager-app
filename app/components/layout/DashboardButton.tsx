import { getCurrentUser } from '@/lib/dal';
import Button from '@/app/components/ui/Button';
import Link from 'next/link';

const DashboardButton = async () => {
  const user = await getCurrentUser();

  if (user) {
    return (
      <Link href="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/signin">
        <Button variant="outline">Sign in</Button>
      </Link>
      <Link href="/signup">
        <Button>Sign up</Button>
      </Link>
    </div>
  );
};

export default DashboardButton;
