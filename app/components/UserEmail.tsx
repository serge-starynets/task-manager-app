import { getCurrentUser, isAdmin } from '@/lib/dal';
import { UserIcon } from 'lucide-react';
import SignOutButton from './SignOutButton';

const UserEmail = async () => {
  const user = await getCurrentUser();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-start px-2 py-2">
        <UserIcon size={20} className="text-gray-500 mr-2 shrink-0" />
        <div className="hidden md:flex flex-col min-w-0">
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {user?.email}
          </span>
          {user && (
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {isAdmin(user) ? 'Admin' : 'Standard user'}
            </span>
          )}
        </div>
      </div>
      <SignOutButton />
    </div>
  );
};

export default UserEmail;
