import { useEffect, useState, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  itemCount: number;
  onSelect?: (index: number) => void;
  onActivate?: (index: number) => void;
  onDelete?: (index: number) => void;
  onToggle?: (index: number) => void;
  enabled?: boolean;
  wrap?: boolean;
}

export function useKeyboardNavigation({
  itemCount,
  onSelect,
  onActivate,
  onDelete,
  onToggle,
  enabled = true,
  wrap = true
}: KeyboardNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isNavigating, setIsNavigating] = useState(false);

  const moveSelection = useCallback((direction: 'up' | 'down') => {
    if (!enabled || itemCount === 0) return;

    setIsNavigating(true);
    setSelectedIndex(current => {
      const next = direction === 'up' ? current - 1 : current + 1;
      
      if (wrap) {
        if (next < 0) return itemCount - 1;
        if (next >= itemCount) return 0;
        return next;
      } else {
        return Math.max(0, Math.min(itemCount - 1, next));
      }
    });
  }, [enabled, itemCount, wrap]);

  const selectFirst = useCallback(() => {
    if (!enabled || itemCount === 0) return;
    setIsNavigating(true);
    setSelectedIndex(0);
  }, [enabled, itemCount]);

  const selectLast = useCallback(() => {
    if (!enabled || itemCount === 0) return;
    setIsNavigating(true);
    setSelectedIndex(itemCount - 1);
  }, [enabled, itemCount]);

  const clearSelection = useCallback(() => {
    setSelectedIndex(-1);
    setIsNavigating(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keyboard navigation if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (selectedIndex === -1) {
            selectFirst();
          } else {
            moveSelection('down');
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (selectedIndex === -1) {
            selectLast();
          } else {
            moveSelection('up');
          }
          break;

        case 'Home':
          event.preventDefault();
          selectFirst();
          break;

        case 'End':
          event.preventDefault();
          selectLast();
          break;

        case 'Enter':
          if (selectedIndex >= 0 && onActivate) {
            event.preventDefault();
            onActivate(selectedIndex);
          }
          break;

        case ' ':
          if (selectedIndex >= 0 && onToggle) {
            event.preventDefault();
            onToggle(selectedIndex);
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (selectedIndex >= 0 && onDelete) {
            event.preventDefault();
            onDelete(selectedIndex);
          }
          break;

        case 'Escape':
          clearSelection();
          break;

        default:
          // Letter/number keys for quick selection
          if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
            onSelect?.(selectedIndex);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    selectedIndex,
    moveSelection,
    selectFirst,
    selectLast,
    clearSelection,
    onActivate,
    onDelete,
    onToggle,
    onSelect
  ]);

  // Reset selection when item count changes
  useEffect(() => {
    if (selectedIndex >= itemCount) {
      setSelectedIndex(itemCount > 0 ? itemCount - 1 : -1);
    }
  }, [itemCount, selectedIndex]);

  // Clear selection when navigation is disabled
  useEffect(() => {
    if (!enabled) {
      clearSelection();
    }
  }, [enabled, clearSelection]);

  return {
    selectedIndex,
    isNavigating,
    clearSelection,
    selectFirst,
    selectLast,
    setSelectedIndex
  };
}