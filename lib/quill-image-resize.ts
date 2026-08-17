import type Quill from 'quill';

type QuillEditor = Quill;

const MIN_WIDTH = 80;
const CORNER_HIT = 24;

function getQuillClass(): typeof Quill {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-quill-new').Quill as typeof Quill;
}

function parseWidth(img: HTMLImageElement): number {
  const attr = img.getAttribute('width');
  if (attr && /^\d+$/.test(attr)) return Number(attr);
  if (img.style.width) {
    const parsed = parseInt(img.style.width, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return img.getBoundingClientRect().width;
}

function applyWidth(
  img: HTMLImageElement,
  width: number,
  QuillClass: typeof Quill,
) {
  const px = Math.round(width);
  img.setAttribute('width', String(px));
  img.style.width = `${px}px`;
  img.style.height = 'auto';
  img.style.maxWidth = '100%';

  const blot = QuillClass.find(img) as {
    format?: (name: string, value: string) => void;
  } | null;
  blot?.format?.('width', String(px));
}

function isEditorImage(img: Element | null): img is HTMLImageElement {
  return img instanceof HTMLImageElement;
}

function isNearImageCorner(img: HTMLImageElement, clientX: number, clientY: number) {
  const rect = img.getBoundingClientRect();
  return (
    clientX >= rect.right - CORNER_HIT &&
    clientX <= rect.right + 4 &&
    clientY >= rect.top - 4 &&
    clientY <= rect.top + CORNER_HIT
  );
}

/** Adds click-to-select and drag-to-resize for images inside a Quill editor. */
export function initQuillImageResize(
  quill: QuillEditor,
  mount: HTMLElement,
  onResize: () => void,
): () => void {
  const QuillClass = getQuillClass();
  const root = quill.root;
  let selected: HTMLImageElement | null = null;
  let overlay: HTMLDivElement | null = null;
  let handle: HTMLDivElement | null = null;
  let dragging = false;
  let activeMove: ((event: MouseEvent) => void) | null = null;
  let activeUp: ((event: MouseEvent) => void) | null = null;

  function clearSelection() {
    if (dragging) return;
    selected?.classList.remove('ql-image-selected');
    selected = null;
    overlay?.remove();
    overlay = null;
    handle = null;
  }

  function positionOverlay() {
    if (!selected || !overlay) return;
    const mountRect = mount.getBoundingClientRect();
    const imgRect = selected.getBoundingClientRect();
    overlay.style.left = `${imgRect.left - mountRect.left + mount.scrollLeft}px`;
    overlay.style.top = `${imgRect.top - mountRect.top + mount.scrollTop}px`;
    overlay.style.width = `${imgRect.width}px`;
    overlay.style.height = `${imgRect.height}px`;
  }

  function startDrag(img: HTMLImageElement, startX: number) {
    dragging = true;
    quill.enable(false);

    const startWidth = parseWidth(img);
    const maxWidth = root.clientWidth;

    function onMouseMove(event: MouseEvent) {
      event.preventDefault();
      const delta = event.clientX - startX;
      const next = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth + delta));
      applyWidth(img, next, QuillClass);
      positionOverlay();
    }

    function onMouseUp(event: MouseEvent) {
      event.preventDefault();
      if (activeMove) {
        document.removeEventListener('mousemove', activeMove);
        activeMove = null;
      }
      if (activeUp) {
        document.removeEventListener('mouseup', activeUp);
        activeUp = null;
      }
      quill.enable(true);
      dragging = false;
      positionOverlay();
      onResize();
    }

    activeMove = onMouseMove;
    activeUp = onMouseUp;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function selectImage(img: HTMLImageElement) {
    if (selected === img) return;
    clearSelection();
    selected = img;
    img.classList.add('ql-image-selected');

    overlay = document.createElement('div');
    overlay.className = 'ql-image-resize-overlay';
    handle = document.createElement('div');
    handle.className = 'ql-image-resize-handle';
    handle.setAttribute('aria-label', 'Resize image');
    overlay.appendChild(handle);
    mount.appendChild(overlay);
    positionOverlay();

    handle.addEventListener('mousedown', (event) => {
      if (!selected) return;
      event.preventDefault();
      event.stopPropagation();
      startDrag(selected, event.clientX);
    });
  }

  function onEditorMouseDown(event: MouseEvent) {
    const target = event.target as Element | null;

    if (handle && target && (target === handle || handle.contains(target))) {
      return;
    }

    if (isEditorImage(target) && root.contains(target)) {
      if (selected === target && isNearImageCorner(target, event.clientX, event.clientY)) {
        event.preventDefault();
        event.stopPropagation();
        startDrag(target, event.clientX);
        return;
      }

      if (selected !== target) {
        event.preventDefault();
        event.stopPropagation();
        selectImage(target);
      }
      return;
    }

    if (!dragging) {
      clearSelection();
    }
  }

  function onTextChange() {
    if (!dragging) {
      positionOverlay();
    }
  }

  root.addEventListener('mousedown', onEditorMouseDown, true);
  quill.on('text-change', onTextChange);
  window.addEventListener('resize', positionOverlay);
  mount.addEventListener('scroll', positionOverlay, true);

  return () => {
    if (activeMove) document.removeEventListener('mousemove', activeMove);
    if (activeUp) document.removeEventListener('mouseup', activeUp);
    quill.enable(true);
    clearSelection();
    root.removeEventListener('mousedown', onEditorMouseDown, true);
    quill.off('text-change', onTextChange);
    window.removeEventListener('resize', positionOverlay);
    mount.removeEventListener('scroll', positionOverlay, true);
  };
}

/** Resolve the Quill instance from a mounted editor wrapper element. */
export function findQuillEditor(container: HTMLElement | null): QuillEditor | null {
  if (!container || typeof window === 'undefined') return null;

  const QuillClass = getQuillClass();
  const qlContainer = container.querySelector('.ql-container');
  const qlEditor = container.querySelector('.ql-editor');

  return (
    (qlContainer && (QuillClass.find(qlContainer) as QuillEditor | null)) ||
    (qlEditor && (QuillClass.find(qlEditor) as QuillEditor | null)) ||
    null
  );
}
