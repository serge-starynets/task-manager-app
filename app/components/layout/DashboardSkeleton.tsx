export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-32 rounded-xl bg-gray-200 dark:bg-white/[0.08]" />
        <div className="h-10 w-36 rounded-xl bg-gray-200 dark:bg-white/[0.08]" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/90 shadow-soft dark:border-white/[0.08] dark:bg-dark-high dark:shadow-none">
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,4.5fr)_minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-4 border-b border-black/[0.05] bg-gray-50/70 px-6 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
        </div>
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,4.5fr)_minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] items-center gap-4 px-6 py-4"
            >
              <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-4 rounded bg-gray-200 dark:bg-white/[0.08]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
