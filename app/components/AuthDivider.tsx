export default function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-dark-border-default" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-background px-3 text-gray-500 dark:text-gray-400">
          or continue with email
        </span>
      </div>
    </div>
  );
}
