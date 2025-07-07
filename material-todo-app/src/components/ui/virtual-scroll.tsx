import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualScrollItem {
  id: string;
  height?: number;
}

interface VirtualScrollProps<T extends VirtualScrollItem> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  className?: string;
  getItemHeight?: (item: T, index: number) => number;
}

export function VirtualScroll<T extends VirtualScrollItem>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  renderItem,
  onScroll,
  className,
  getItemHeight,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate which items should be visible
  const visibleRange = useMemo(() => {
    const itemCount = items.length;
    
    if (getItemHeight) {
      // Variable height calculation
      let totalHeight = 0;
      let startIndex = 0;
      let endIndex = 0;
      
      // Find start index
      for (let i = 0; i < itemCount; i++) {
        const height = getItemHeight(items[i], i);
        if (totalHeight + height > scrollTop) {
          startIndex = Math.max(0, i - overscan);
          break;
        }
        totalHeight += height;
      }
      
      // Find end index
      let visibleHeight = 0;
      for (let i = startIndex; i < itemCount; i++) {
        const height = getItemHeight(items[i], i);
        visibleHeight += height;
        if (visibleHeight > containerHeight + overscan * itemHeight) {
          endIndex = Math.min(itemCount - 1, i + overscan);
          break;
        }
        endIndex = i;
      }
      
      return { startIndex, endIndex };
    } else {
      // Fixed height calculation
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const endIndex = Math.min(
        items.length - 1,
        startIndex + visibleCount + overscan * 2
      );
      
      return { startIndex, endIndex };
    }
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan, getItemHeight, items]);

  // Calculate total height and offset
  const totalHeight = useMemo(() => {
    if (getItemHeight) {
      return items.reduce((total, item, index) => total + getItemHeight(item, index), 0);
    }
    return items.length * itemHeight;
  }, [items, itemHeight, getItemHeight]);

  const offsetY = useMemo(() => {
    if (getItemHeight) {
      let offset = 0;
      for (let i = 0; i < visibleRange.startIndex; i++) {
        offset += getItemHeight(items[i], i);
      }
      return offset;
    }
    return visibleRange.startIndex * itemHeight;
  }, [visibleRange.startIndex, itemHeight, getItemHeight, items]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (items[i]) {
        items_to_render.push({
          item: items[i],
          index: i,
        });
      }
    }
    return items_to_render;
  }, [items, visibleRange]);

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className || ''}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={item.id}
              style={{
                height: getItemHeight ? getItemHeight(item, index) : itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook for managing virtual scroll state
export function useVirtualScroll<T extends VirtualScrollItem>({
  items,
  containerHeight,
  itemHeight = 80,
  overscan = 5,
}: {
  items: T[];
  containerHeight: number;
  itemHeight?: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(
      items.length - 1,
      startIndex + visibleCount + overscan * 2
    );
    
    return { startIndex, endIndex, visibleCount };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    totalHeight,
    offsetY,
    visibleItems: items.slice(visibleRange.startIndex, visibleRange.endIndex + 1),
  };
}