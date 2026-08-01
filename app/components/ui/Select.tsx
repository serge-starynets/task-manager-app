'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectOption = {
  label: string;
  value: string;
};

export interface SelectProps {
  id?: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  'aria-describedby'?: string;
}

export default function Select({
  id,
  name,
  options,
  value: valueProp,
  defaultValue,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select…',
  className,
  'aria-describedby': ariaDescribedBy,
}: SelectProps) {
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;
  const triggerId = id ?? `${generatedId}-trigger`;

  const isControlled = valueProp !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? '',
  );
  const value = isControlled ? valueProp : uncontrolledValue;

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const selectedIndex = options.findIndex((option) => option.value === value);

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const close = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, selectedIndex]);

  const selectAtIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      setValue(option.value);
      close();
    },
    [options, setValue, close],
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, close]);

  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    const item = listRef.current?.children[highlightedIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [open, highlightedIndex]);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) {
          openList();
        } else if (event.key === 'Enter' || event.key === ' ') {
          if (highlightedIndex >= 0) selectAtIndex(highlightedIndex);
        } else if (event.key === 'ArrowDown') {
          setHighlightedIndex((i) =>
            i < options.length - 1 ? i + 1 : 0,
          );
        } else if (event.key === 'ArrowUp') {
          setHighlightedIndex((i) =>
            i > 0 ? i - 1 : options.length - 1,
          );
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setHighlightedIndex(options.length - 1);
        }
        break;
      default:
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-required={required || undefined}
        aria-describedby={ariaDescribedBy}
        onClick={() => (open ? close() : openList())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm transition-shadow duration-200',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-dark-border-medium dark:bg-dark-elevated dark:text-gray-100 dark:focus:border-purple-500/60',
          open &&
            'ring-2 ring-purple-500/30 border-purple-400 dark:border-purple-500/60',
          className,
        )}
      >
        <span
          className={cn(
            'truncate',
            !selectedOption && 'text-gray-400 dark:text-gray-500',
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDownIcon
          size={16}
          className={cn(
            'shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500',
            open && 'rotate-180 text-purple-500 dark:text-purple-400',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          tabIndex={-1}
          className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-gray-200/80 bg-white py-1 shadow-lift dark:border-dark-border-default dark:bg-dark-high dark:shadow-none scrollbar-thin"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => {
                  // Prevent button blur before click registers
                  event.preventDefault();
                }}
                onClick={() => selectAtIndex(index)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors',
                  isHighlighted &&
                    'bg-gray-100 dark:bg-dark-elevated',
                  isSelected &&
                    'font-medium text-purple-700 dark:text-purple-300',
                  !isSelected && 'text-gray-800 dark:text-gray-200',
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <CheckIcon
                    size={16}
                    className="shrink-0 text-purple-600 dark:text-purple-400"
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
