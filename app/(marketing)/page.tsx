import Link from 'next/link';
import {
  ArrowRightIcon,
  LayoutGridIcon,
  ListTodoIcon,
  SparklesIcon,
} from 'lucide-react';
import Button from '../components/ui/Button';

function ProductPreview() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-5xl animate-fade-up">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-violet-500/15 via-violet-500/5 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white/80 shadow-lift backdrop-blur-sm dark:border-white/[0.1] dark:bg-[#1c1c22]/90">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            WEB · Website refresh
          </p>
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            Board
          </span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            {
              label: 'To do',
              count: 3,
              cards: ['Draft landing copy', 'Collect screenshots'],
              accent: 'bg-zinc-400',
            },
            {
              label: 'In progress',
              count: 2,
              cards: ['Ship auth polish', 'Tune board density'],
              accent: 'bg-blue-500',
            },
            {
              label: 'Done',
              count: 4,
              cards: ['Project abbreviations', 'Dark theme tokens'],
              accent: 'bg-emerald-500',
            },
          ].map((column) => (
            <div
              key={column.label}
              className="rounded-2xl border border-black/[0.05] bg-gray-50/80 p-3 dark:border-white/[0.08] dark:bg-black/25"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${column.accent}`} />
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {column.label}
                  </p>
                </div>
                <span className="text-[11px] font-medium tabular-nums text-gray-400">
                  {column.count}
                </span>
              </div>
              <div className="space-y-2">
                {column.cards.map((title) => (
                  <div
                    key={title}
                    className="rounded-xl border border-black/[0.05] bg-white px-3 py-2.5 shadow-soft dark:border-white/[0.1] dark:bg-[#25252c] dark:shadow-none"
                  >
                    <p className="font-mono text-[11px] text-gray-400">WEB-12</p>
                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                      {title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  return (
    <div className="flex flex-col">
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-violet-50/80 px-3 py-1 text-xs font-semibold tracking-wide text-violet-700 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-300">
              <SparklesIcon size={13} />
              Built for solo projects
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
              Task tracking
              <br className="hidden sm:block" />{' '}
              <span className="font-serif italic font-normal text-violet-600 dark:text-violet-400">
                simplified
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-gray-600 sm:text-xl dark:text-gray-300">
              A calm workspace for ideas, backlogs, and boards — without the
              noise of team software.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg">
                  Get Started
                  <ArrowRightIcon size={18} />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline">
                  See features
                </Button>
              </Link>
            </div>
          </div>
          <ProductPreview />

          <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              {
                icon: ListTodoIcon,
                title: 'Backlog first',
                copy: 'Scan, sort, and open work from a dense, readable list.',
              },
              {
                icon: LayoutGridIcon,
                title: 'Visual board',
                copy: 'Drag tickets through a quiet kanban when status needs a shape.',
              },
              {
                icon: SparklesIcon,
                title: 'Just enough',
                copy: 'Projects, bugs, attachments, and relations — nothing extra.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-black/[0.06] bg-white/70 p-5 text-left shadow-soft dark:border-white/[0.08] dark:bg-dark-high/70 dark:shadow-none"
              >
                <item.icon
                  size={18}
                  className="mb-3 text-violet-600 dark:text-violet-400"
                />
                <h2 className="font-semibold tracking-tight text-gray-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
