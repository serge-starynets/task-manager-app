import { getCurrentUserNotes } from '@/lib/dal';
import PaperNotesBoard from '@/app/components/notes/PaperNotesBoard';

export default async function NotesPage() {
  const notes = await getCurrentUserNotes();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div>
        <h1 className="page-title">Paper board</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quick sticky notes — capture ideas before they become tasks.
        </p>
      </div>
      <PaperNotesBoard notes={notes} />
    </div>
  );
}
