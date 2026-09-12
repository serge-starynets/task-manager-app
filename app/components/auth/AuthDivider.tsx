export default function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-3 text-gray-500 dark:bg-dark-high dark:text-gray-400">
          or continue with email
        </span>
      </div>
    </div>
  );
}
