'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  createNote,
  deleteNote,
  placeNote,
  unplaceNote,
  updateNote,
} from '@/app/actions/notes';
import type { Note } from '@/db/schema';
import { MAX_NOTE_CONTENT_LENGTH } from '@/lib/validations/note';
import { cn } from '@/lib/utils';
import Button from '@/app/components/ui/Button';

const NOTE_WIDTH = 202;
const NOTE_HEIGHT = 202;
const DRAG_THRESHOLD = 6;
const STACK_COLORS = [
  'bg-[#fff7b8]',
  'bg-[#ffe4a8]',
  'bg-[#ffd6e0]',
  'bg-[#d8f5e2]',
  'bg-[#dce9ff]',
] as const;

type DragState = {
  noteId: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  fromStack: boolean;
  startClientX: number;
  startClientY: number;
  active: boolean;
};

function noteColor(id: number) {
  return STACK_COLORS[Math.abs(id) % STACK_COLORS.length];
}

function isOnBoard(note: Note) {
  return note.posX != null && note.posY != null;
}

function blockImagePaste(event: React.ClipboardEvent) {
  const items = event.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault();
      return;
    }
  }
}

function blockImageDrop(event: React.DragEvent) {
  const types = Array.from(event.dataTransfer?.types ?? []);
  if (types.includes('Files')) {
    event.preventDefault();
  }
}

interface PaperNotesBoardProps {
  notes: Note[];
}

export default function PaperNotesBoard({
  notes: initialNotes,
}: PaperNotesBoardProps) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const editingShellRef = useRef<HTMLDivElement | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [editingId, setEditingId] = useState<number | 'draft' | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const editingIdRef = useRef<number | 'draft' | null>(null);
  const draftContentRef = useRef('');
  const editContentRef = useRef('');
  const notesRef = useRef(notes);
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | 'draft' | null>(null);
  const savingOutsideRef = useRef(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    dragPosRef.current = dragPos;
  }, [dragPos]);

  useEffect(() => {
    editingIdRef.current = editingId;
  }, [editingId]);

  useEffect(() => {
    draftContentRef.current = draftContent;
  }, [draftContent]);

  useEffect(() => {
    editContentRef.current = editContent;
  }, [editContent]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const stackNotes = useMemo(
    () => notes.filter((note) => !isOnBoard(note)),
    [notes],
  );

  /** Oldest underneath, most recently placed/moved on top. */
  const boardNotes = useMemo(
    () =>
      notes
        .filter((note) => isOnBoard(note))
        .sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
        ),
    [notes],
  );

  const clampToBoard = useCallback((x: number, y: number) => {
    const board = boardRef.current;
    if (!board) return { x: Math.max(0, x), y: Math.max(0, y) };
    const maxX = Math.max(0, board.clientWidth - NOTE_WIDTH);
    const maxY = Math.max(0, board.clientHeight - NOTE_HEIGHT);
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  }, []);

  function beginEdit(note: Note) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
  }

  async function handleSaveDraft(options?: { silent?: boolean }) {
    const content = draftContentRef.current.trim();
    if (!content) {
      if (!options?.silent) toast.error('Write something first');
      setDraftContent('');
      setEditingId(null);
      return false;
    }
    setBusyId('draft');
    const result = await createNote({ content });
    setBusyId(null);
    if (!result.success || !result.note) {
      toast.error(result.message || 'Failed to save note');
      return false;
    }
    setNotes((prev) => [result.note!, ...prev]);
    setDraftContent('');
    setEditingId(null);
    startTransition(() => router.refresh());
    return true;
  }

  async function handleSaveEdit(
    noteId: number,
    options?: { silent?: boolean },
  ) {
    const content = editContentRef.current.trim();
    if (!content) {
      if (!options?.silent) toast.error('Note cannot be empty');
      cancelEdit();
      return false;
    }

    const existing = notesRef.current.find((note) => note.id === noteId);
    if (existing && existing.content === content) {
      cancelEdit();
      return true;
    }

    setBusyId(noteId);
    const result = await updateNote({ noteId, content });
    setBusyId(null);
    if (!result.success || !result.note) {
      toast.error(result.message || 'Failed to update note');
      return false;
    }
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? result.note! : note)),
    );
    setEditingId(null);
    setEditContent('');
    startTransition(() => router.refresh());
    return true;
  }

  const commitEditOnOutside = useCallback(() => {
    const currentEditing = editingIdRef.current;
    if (currentEditing == null || savingOutsideRef.current) return;

    savingOutsideRef.current = true;

    // Leave edit mode immediately so the same click can start a drag.
    const draftSnapshot = draftContentRef.current.trim();
    const editSnapshot = editContentRef.current.trim();
    editingIdRef.current = null;
    setEditingId(null);
    setEditContent('');

    void (async () => {
      try {
        if (currentEditing === 'draft') {
          if (!draftSnapshot) {
            setDraftContent('');
            return;
          }
          setBusyId('draft');
          const result = await createNote({ content: draftSnapshot });
          setBusyId(null);
          if (!result.success || !result.note) {
            toast.error(result.message || 'Failed to save note');
            return;
          }
          setDraftContent('');
          setNotes((prev) => [result.note!, ...prev]);
          startTransition(() => router.refresh());
          return;
        }

        const existing = notesRef.current.find(
          (note) => note.id === currentEditing,
        );
        if (!editSnapshot) {
          return;
        }
        if (existing && existing.content === editSnapshot) {
          return;
        }

        setBusyId(currentEditing);
        const result = await updateNote({
          noteId: currentEditing,
          content: editSnapshot,
        });
        setBusyId(null);
        if (!result.success || !result.note) {
          toast.error(result.message || 'Failed to update note');
          return;
        }
        setNotes((prev) =>
          prev.map((note) =>
            note.id === currentEditing ? result.note! : note,
          ),
        );
        startTransition(() => router.refresh());
      } finally {
        savingOutsideRef.current = false;
      }
    })();
  }, [router]);

  useEffect(() => {
    if (editingId == null) return;

    function onPointerDownCapture(event: PointerEvent) {
      const shell = editingShellRef.current;
      const target = event.target as Node | null;
      if (!shell || !target) return;
      if (shell.contains(target)) return;
      commitEditOnOutside();
    }

    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDownCapture, true);
    };
  }, [editingId, commitEditOnOutside]);

  async function handleDelete(noteId: number) {
    setBusyId(noteId);
    const result = await deleteNote(noteId);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.message || 'Failed to delete note');
      return;
    }
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    if (editingId === noteId) cancelEdit();
    startTransition(() => router.refresh());
  }

  async function handleUnplace(noteId: number) {
    setBusyId(noteId);
    const result = await unplaceNote(noteId);
    setBusyId(null);
    if (!result.success || !result.note) {
      toast.error(result.message || 'Failed to remove note');
      return;
    }
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? result.note! : note)),
    );
    startTransition(() => router.refresh());
  }

  function startPointer(
    event: React.PointerEvent,
    note: Note,
    fromStack: boolean,
  ) {
    if (!note.content.trim()) return;
    if (event.button !== 0) return;

    const board = boardRef.current;
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    let pointerOffsetX: number;
    let pointerOffsetY: number;

    if (fromStack) {
      const noteRect = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();
      pointerOffsetX = event.clientX - noteRect.left;
      pointerOffsetY = event.clientY - noteRect.top;
    } else {
      pointerOffsetX = event.clientX - boardRect.left - (note.posX ?? 0);
      pointerOffsetY = event.clientY - boardRect.top - (note.posY ?? 0);
    }

    const next: DragState = {
      noteId: note.id,
      pointerOffsetX,
      pointerOffsetY,
      fromStack,
      startClientX: event.clientX,
      startClientY: event.clientY,
      active: false,
    };
    dragRef.current = next;
    setDrag(next);
    window.getSelection()?.removeAllRanges();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function onPointerMove(event: React.PointerEvent) {
    const current = dragRef.current;
    if (!current || !boardRef.current) return;

    const dx = event.clientX - current.startClientX;
    const dy = event.clientY - current.startClientY;
    const distance = Math.hypot(dx, dy);

    if (!current.active && distance < DRAG_THRESHOLD) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const nextPos = clampToBoard(
      event.clientX - boardRect.left - current.pointerOffsetX,
      event.clientY - boardRect.top - current.pointerOffsetY,
    );

    if (!current.active) {
      const activated = { ...current, active: true };
      dragRef.current = activated;
      setDrag(activated);
      window.getSelection()?.removeAllRanges();
    }

    dragPosRef.current = nextPos;
    setDragPos(nextPos);
  }

  useEffect(() => {
    if (!drag?.active) return;

    function preventSelect(event: Event) {
      event.preventDefault();
    }

    document.addEventListener('selectstart', preventSelect);
    document.body.classList.add('select-none');
    return () => {
      document.removeEventListener('selectstart', preventSelect);
      document.body.classList.remove('select-none');
    };
  }, [drag?.active]);

  async function onPointerUp() {
    const current = dragRef.current;
    const pos = dragPosRef.current;
    dragRef.current = null;
    dragPosRef.current = null;
    setDrag(null);
    setDragPos(null);

    if (!current) return;

    if (!current.active) {
      const note = notes.find((item) => item.id === current.noteId);
      if (note) beginEdit(note);
      return;
    }

    if (!pos) return;

    const now = new Date();
    setNotes((prev) =>
      prev.map((note) =>
        note.id === current.noteId
          ? { ...note, posX: pos.x, posY: pos.y, updatedAt: now }
          : note,
      ),
    );

    const result = await placeNote({
      noteId: current.noteId,
      posX: pos.x,
      posY: pos.y,
    });
    if (!result.success || !result.note) {
      toast.error(result.message || 'Failed to place note');
      startTransition(() => router.refresh());
      return;
    }
    setNotes((prev) =>
      prev.map((note) =>
        note.id === current.noteId ? result.note! : note,
      ),
    );
    startTransition(() => router.refresh());
  }

  function renderNoteBody(
    note: Note | null,
    options: {
      mode: 'stack' | 'board' | 'ghost';
      isDraft?: boolean;
      zIndex?: number;
    },
  ) {
    const isDraft = options.isDraft === true;
    const id = isDraft ? 'draft' : note!.id;
    const isEditing = editingId === id;
    const content = isDraft
      ? draftContent
      : isEditing
        ? editContent
        : note!.content;
    const colorClass = isDraft ? STACK_COLORS[0] : noteColor(note!.id);
    const canDrag =
      !isDraft &&
      !isEditing &&
      options.mode !== 'ghost' &&
      Boolean(note?.content.trim());

    return (
      <div
        ref={isEditing || isDraft ? editingShellRef : undefined}
        className={cn(
          'relative flex h-[202px] w-[202px] flex-col rounded-sm border border-black/10 p-3 shadow-[2px_3px_8px_rgba(24,24,27,0.12)]',
          colorClass,
          'font-note text-[16px] leading-snug text-zinc-800',
          !isEditing && !isDraft && 'select-none',
          canDrag && 'cursor-grab touch-none active:cursor-grabbing',
          options.mode === 'ghost' &&
            'pointer-events-none opacity-95 shadow-lift rotate-1',
          options.mode === 'board' && 'absolute',
        )}
        style={
          options.mode === 'board' &&
          note &&
          note.posX != null &&
          note.posY != null
            ? {
                left: note.posX,
                top: note.posY,
                zIndex: options.zIndex ?? 10,
              }
            : undefined
        }
        onPointerDown={
          canDrag && note
            ? (event) => startPointer(event, note, options.mode === 'stack')
            : undefined
        }
      >
        {isEditing || isDraft ? (
          <>
            <textarea
              value={content}
              maxLength={MAX_NOTE_CONTENT_LENGTH}
              onChange={(event) => {
                const value = event.target.value.slice(
                  0,
                  MAX_NOTE_CONTENT_LENGTH,
                );
                if (isDraft) setDraftContent(value);
                else setEditContent(value);
              }}
              onPaste={blockImagePaste}
              onDrop={blockImageDrop}
              onDragOver={blockImageDrop}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              placeholder="Jot it down…"
              className="h-full w-full resize-none bg-transparent font-note text-[16px] leading-snug text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
              autoFocus
            />
            <div
              className="mt-2 flex items-center justify-between gap-1"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <span className="text-[10px] font-sans text-zinc-500">
                {content.length}/{MAX_NOTE_CONTENT_LENGTH}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => {
                    if (isDraft) {
                      setDraftContent('');
                      setEditingId(null);
                    } else {
                      cancelEdit();
                    }
                  }}
                  disabled={busyId === id}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  isLoading={busyId === id}
                  onClick={() =>
                    isDraft
                      ? void handleSaveDraft()
                      : void handleSaveEdit(note!.id)
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="min-h-0 flex-1 overflow-hidden whitespace-pre-wrap break-words">
              {note!.content || (
                <span className="text-zinc-400">Empty note</span>
              )}
            </p>
            {options.mode === 'stack' && (
              <div
                className="mt-2 flex justify-end"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="h-7 px-2 text-[11px]"
                  isLoading={busyId === note!.id}
                  onClick={() => void handleDelete(note!.id)}
                >
                  Delete
                </Button>
              </div>
            )}
            {options.mode === 'board' && (
              <button
                type="button"
                className="absolute bottom-1.5 right-2 font-sans text-[10px] font-medium uppercase tracking-wide text-zinc-500 hover:text-red-600"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleUnplace(note!.id);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                disabled={busyId === note!.id}
              >
                Remove
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const draggingNote =
    drag?.active && dragPos
      ? notes.find((note) => note.id === drag.noteId)
      : null;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 gap-4',
        drag?.active && 'select-none',
      )}
      onPointerMove={onPointerMove}
      onPointerUp={() => void onPointerUp()}
      onPointerCancel={() => {
        dragRef.current = null;
        dragPosRef.current = null;
        setDrag(null);
        setDragPos(null);
      }}
    >
      <div
        ref={boardRef}
        className="relative min-h-[28rem] min-w-0 flex-1 overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-[#fbfbf8] shadow-inner dark:border-zinc-600 dark:bg-[#1a1a1c]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(24 24 27 / 0.08) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        {boardNotes.map((note, index) => {
          if (drag?.active && drag.noteId === note.id) return null;
          return (
            <div key={note.id} className="contents">
              {renderNoteBody(note, {
                mode: 'board',
                zIndex: index + 1,
              })}
            </div>
          );
        })}
        {draggingNote && dragPos && (
          <div
            className="pointer-events-none absolute z-50"
            style={{ left: dragPos.x, top: dragPos.y }}
          >
            {renderNoteBody(draggingNote, { mode: 'ghost' })}
          </div>
        )}
        {boardNotes.length === 0 && !draggingNote && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center font-serif text-lg italic text-zinc-400 dark:text-zinc-500">
            Drag notes from the stack onto the board
          </p>
        )}
      </div>

      <aside className="flex w-[12.5rem] shrink-0 flex-col gap-3 overflow-y-auto scrollbar-thin md:w-[13.5rem]">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
            Notes stack
          </p>
          <div
            onClick={() => {
              if (editingId !== 'draft') setEditingId('draft');
            }}
          >
            {editingId === 'draft' ? (
              renderNoteBody(null, { mode: 'stack', isDraft: true })
            ) : (
              <div
                className={cn(
                  'flex h-[202px] w-[202px] cursor-text flex-col rounded-sm border border-dashed border-black/15 p-3',
                  STACK_COLORS[0],
                  'font-note text-[16px] leading-snug text-zinc-500',
                )}
              >
                <span>New note…</span>
                <span className="mt-auto font-sans text-[10px] text-zinc-400">
                  Click to write
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {stackNotes.map((note) => {
            if (drag?.active && drag.noteId === note.id) {
              return (
                <div
                  key={note.id}
                  className="h-[202px] w-[202px] rounded-sm border border-dashed border-black/10 bg-black/[0.03]"
                />
              );
            }
            return (
              <div key={note.id}>
                {renderNoteBody(note, { mode: 'stack' })}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
