import { getCurrentUser, isAdmin } from '@/lib/dal';
import { UserIcon } from 'lucide-react';
import SignOutButton from './SignOutButton';

const UserEmail = async () => {
  const user = await getCurrentUser();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-start px-2.5 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-200/70 text-gray-500 dark:bg-dark-high dark:text-gray-400 mr-2.5">
          <UserIcon size={16} />
        </span>
        <div className="hidden md:flex flex-col min-w-0">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
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
