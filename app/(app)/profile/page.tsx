import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import ProfileForm from '@/app/components/profile/ProfileForm';
import { requireUser } from '@/lib/dal';
import { userHasGoogleAccount } from '@/lib/services/profile-service';

export default async function ProfilePage() {
  const user = await requireUser();
  const hasGoogleAccount = await userHasGoogleAccount(user.id);

  return (
    <div className="mx-auto w-full max-w-xl">
      <Link href="/dashboard" className="back-link mb-6">
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="page-title mb-2">Profile</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Manage how you appear across Projenda.
      </p>

      <div className="surface-panel p-6">
        <ProfileForm user={user} hasGoogleAccount={hasGoogleAccount} />
      </div>
    </div>
  );
}
