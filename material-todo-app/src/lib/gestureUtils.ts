import { useGesture } from '@use-gesture/react';
import { useSpring, animated, config } from 'react-spring';
import { useState, useCallback, useRef } from 'react';

// Gesture configuration constants
export const GESTURE_CONFIG = {
  // Swipe thresholds
  SWIPE_THRESHOLD: 0.3, // 30% of container width
  SWIPE_VELOCITY_THRESHOLD: 0.2,
  SWIPE_MIN_DISTANCE: 50,
  
  // Pull to refresh
  PULL_THRESHOLD: 80,
  PULL_MAX: 120,
  
  // Long press
  LONG_PRESS_DURATION: 500,
  
  // Touch feedback
  TOUCH_SCALE: 0.95,
  HAPTIC_FEEDBACK: true,
};

// Touch feedback utilities
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (GESTURE_CONFIG.HAPTIC_FEEDBACK && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    navigator.vibrate(patterns[type]);
  }
};

// Swipe directions
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  enabled?: boolean;
}

export interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  enabled?: boolean;
}

export interface LongPressOptions {
  onLongPress: () => void;
  duration?: number;
  enabled?: boolean;
}

// Hook for swipe gestures
export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = GESTURE_CONFIG.SWIPE_THRESHOLD,
    velocityThreshold = GESTURE_CONFIG.SWIPE_VELOCITY_THRESHOLD,
    enabled = true,
  } = options;

  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [mx, my], velocity: [vx, vy], cancel, canceled }) => {
        if (!enabled || canceled) return;

        // Calculate container dimensions for percentage-based threshold
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        
        const xThreshold = containerWidth * threshold;
        const yThreshold = containerHeight * threshold;

        if (down) {
          api.start({ x: mx, y: my, immediate: true });
        } else {
          // Check for swipe gestures based on distance and velocity
          const isHorizontalSwipe = Math.abs(mx) > Math.abs(my);
          const isVerticalSwipe = Math.abs(my) > Math.abs(mx);

          if (isHorizontalSwipe) {
            if (mx > xThreshold || vx > velocityThreshold) {
              onSwipeRight?.();
              triggerHaptic('medium');
            } else if (mx < -xThreshold || vx < -velocityThreshold) {
              onSwipeLeft?.();
              triggerHaptic('medium');
            }
          } else if (isVerticalSwipe) {
            if (my > yThreshold || vy > velocityThreshold) {
              onSwipeDown?.();
              triggerHaptic('medium');
            } else if (my < -yThreshold || vy < -velocityThreshold) {
              onSwipeUp?.();
              triggerHaptic('medium');
            }
          }

          // Spring back to original position
          api.start({ x: 0, y: 0, config: config.wobbly });
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        threshold: 10,
      },
    }
  );

  return {
    bind: enabled ? bind : () => ({}),
    style: { x, y },
    animated,
  };
}

// Hook for pull-to-refresh gesture
export function usePullToRefresh(options: PullToRefreshOptions) {
  const {
    onRefresh,
    threshold = GESTURE_CONFIG.PULL_THRESHOLD,
    maxPull = GESTURE_CONFIG.PULL_MAX,
    enabled = true,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [{ y, rotateZ }, api] = useSpring(() => ({ y: 0, rotateZ: 0 }));

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [, my], velocity: [, vy], cancel }) => {
        if (!enabled || isRefreshing) return;

        // Only allow pull down at the top of the page
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 0 && my < 0) {
          cancel();
          return;
        }

        const pullDistance = Math.max(0, Math.min(my, maxPull));
        const progress = pullDistance / threshold;

        if (down) {
          api.start({
            y: pullDistance,
            rotateZ: progress * 180,
            immediate: true,
          });

          // Haptic feedback when reaching threshold
          if (pullDistance >= threshold && !isRefreshing) {
            triggerHaptic('medium');
          }
        } else {
          if (pullDistance >= threshold || vy > 0.5) {
            // Trigger refresh
            setIsRefreshing(true);
            api.start({ y: threshold, rotateZ: 360 });
            
            onRefresh().finally(() => {
              setIsRefreshing(false);
              api.start({ y: 0, rotateZ: 0, config: config.gentle });
            });
          } else {
            // Spring back
            api.start({ y: 0, rotateZ: 0, config: config.wobbly });
          }
        }
      },
    },
    {
      drag: {
        axis: 'y',
        filterTaps: true,
        bounds: { top: 0, bottom: maxPull },
      },
    }
  );

  return {
    bind: enabled ? bind : () => ({}),
    style: { y, rotateZ },
    isRefreshing,
    animated,
  };
}

// Hook for long press gesture
export function useLongPress(options: LongPressOptions) {
  const {
    onLongPress,
    duration = GESTURE_CONFIG.LONG_PRESS_DURATION,
    enabled = true,
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const [{ scale }, api] = useSpring(() => ({ scale: 1 }));

  const bind = useGesture(
    {
      onPointerDown: () => {
        if (!enabled) return;
        
        setIsPressed(true);
        api.start({ scale: GESTURE_CONFIG.TOUCH_SCALE });
        
        timeoutRef.current = setTimeout(() => {
          onLongPress();
          triggerHaptic('heavy');
        }, duration);
      },
      onPointerUp: () => {
        if (!enabled) return;
        
        setIsPressed(false);
        api.start({ scale: 1 });
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      },
      onPointerLeave: () => {
        if (!enabled) return;
        
        setIsPressed(false);
        api.start({ scale: 1 });
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      },
    },
    {
      pointer: {
        capture: false,
      },
    }
  );

  return {
    bind: enabled ? bind : () => ({}),
    style: { scale },
    isPressed,
    animated,
  };
}

// Hook for touch-friendly tap gesture with feedback
export function useTouchFeedback() {
  const [{ scale }, api] = useSpring(() => ({ scale: 1 }));

  const bind = useGesture({
    onPointerDown: () => {
      api.start({ scale: GESTURE_CONFIG.TOUCH_SCALE });
      triggerHaptic('light');
    },
    onPointerUp: () => {
      api.start({ scale: 1 });
    },
    onPointerLeave: () => {
      api.start({ scale: 1 });
    },
  });

  return {
    bind,
    style: { scale },
    animated,
  };
}

// Hook for view swipe navigation
export function useViewNavigation(
  currentView: string,
  views: string[],
  onViewChange: (view: string) => void
) {
  const currentIndex = views.indexOf(currentView);

  const swipeOptions: SwipeGestureOptions = {
    onSwipeLeft: () => {
      const nextIndex = Math.min(currentIndex + 1, views.length - 1);
      if (nextIndex !== currentIndex) {
        onViewChange(views[nextIndex]);
        triggerHaptic('medium');
      }
    },
    onSwipeRight: () => {
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex) {
        onViewChange(views[prevIndex]);
        triggerHaptic('medium');
      }
    },
    threshold: 0.2, // 20% of screen width
    enabled: true,
  };

  return useSwipeGesture(swipeOptions);
}

// Utility to detect mobile device
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
};

// Utility to get optimal touch target size
export const getTouchTargetSize = (baseSize: number): number => {
  return isMobileDevice() ? Math.max(baseSize, 44) : baseSize; // 44px minimum for iOS
};

// Spring configurations for different gestures
export const gestureConfigs = {
  gentle: config.gentle,
  wobbly: config.wobbly,
  stiff: config.stiff,
  slow: config.slow,
  bouncy: { tension: 200, friction: 10 },
  snappy: { tension: 400, friction: 40 },
};