function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded bg-gray-200 dark:bg-white/[0.08] ${className ?? ''}`}
    />
  );
}

export default function TaskSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse">
      <div className="mb-8">
        <Bone className="mb-4 h-4 w-28 rounded-xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-3">
            <Bone className="h-4 w-36" />
            <Bone className="h-9 w-72 max-w-full rounded-xl" />
          </div>
          <div className="flex shrink-0 items-center space-x-2">
            <Bone className="h-9 w-20 rounded-xl" />
            <Bone className="h-9 w-20 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="surface-panel mb-8 overflow-hidden p-6">
        <div className="mb-6 flex flex-wrap gap-3">
          <Bone className="h-6 w-20 rounded-full" />
          <Bone className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-3">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-11/12" />
          <Bone className="h-4 w-4/5" />
          <Bone className="h-4 w-3/5" />
        </div>
      </div>

      <div className="surface-panel mb-8 overflow-hidden p-6">
        <Bone className="mb-4 h-6 w-24 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-4 w-40" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-12" />
            <Bone className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-14" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-16" />
            <Bone className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>

      <div className="surface-panel mb-8 overflow-hidden p-6">
        <Bone className="mb-4 h-6 w-36 rounded-xl" />
        <div className="space-y-3">
          <Bone className="h-8 w-full rounded-xl" />
          <Bone className="h-8 w-5/6 rounded-xl" />
        </div>
      </div>

      <div className="surface-panel overflow-hidden p-6">
        <Bone className="mb-4 h-6 w-28 rounded-xl" />
        <div className="space-y-4">
          <Bone className="h-16 w-full rounded-xl" />
          <Bone className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
