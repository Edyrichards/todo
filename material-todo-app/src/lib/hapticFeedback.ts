import { useEffect, useCallback, useRef } from 'react';

// Haptic feedback patterns
export enum HapticPattern {
  LIGHT = 'light',
  MEDIUM = 'medium', 
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
  IMPACT_LIGHT = 'impactLight',
  IMPACT_MEDIUM = 'impactMedium',
  IMPACT_HEAVY = 'impactHeavy',
  NOTIFICATION_SUCCESS = 'notificationSuccess',
  NOTIFICATION_WARNING = 'notificationWarning',
  NOTIFICATION_ERROR = 'notificationError'
}

// Haptic feedback manager
class HapticManager {
  private isSupported: boolean = false;
  private isEnabled: boolean = true;
  private lastHapticTime: number = 0;
  private hapticThrottle: number = 50; // Minimum ms between haptics

  constructor() {
    this.checkSupport();
    this.loadSettings();
  }

  private checkSupport(): void {
    // Check for Haptic API support
    this.isSupported = !!(
      'vibrate' in navigator ||
      'hapticFeedback' in window ||
      ('navigator' in window && 'vibrate' in navigator)
    );

    // Enhanced support check for iOS devices
    if (!this.isSupported && window.DeviceMotionEvent) {
      // iOS devices often support haptics through other means
      this.isSupported = /iPhone|iPad|iPod/.test(navigator.userAgent);
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('haptic-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.isEnabled = settings.enabled !== false;
      }
    } catch (error) {
      console.warn('Failed to load haptic settings:', error);
    }
  }

  public saveSettings(): void {
    try {
      localStorage.setItem('haptic-settings', JSON.stringify({
        enabled: this.isEnabled
      }));
    } catch (error) {
      console.warn('Failed to save haptic settings:', error);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.saveSettings();
  }

  public isHapticSupported(): boolean {
    return this.isSupported;
  }

  public isHapticEnabled(): boolean {
    return this.isEnabled && this.isSupported;
  }

  private shouldThrottle(): boolean {
    const now = Date.now();
    if (now - this.lastHapticTime < this.hapticThrottle) {
      return true;
    }
    this.lastHapticTime = now;
    return false;
  }

  public async triggerHaptic(pattern: HapticPattern): Promise<void> {
    if (!this.isHapticEnabled() || this.shouldThrottle()) {
      return;
    }

    try {
      // iOS Haptic Engine (if available)
      if ('hapticFeedback' in window) {
        await this.triggerIOSHaptic(pattern);
        return;
      }

      // Web Vibration API fallback
      if ('vibrate' in navigator) {
        const vibrationPattern = this.getVibrationPattern(pattern);
        if (vibrationPattern) {
          navigator.vibrate(vibrationPattern);
        }
        return;
      }

      // Custom haptic simulation for unsupported devices
      this.simulateHaptic(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  private async triggerIOSHaptic(pattern: HapticPattern): Promise<void> {
    const hapticFeedback = (window as any).hapticFeedback;
    
    switch (pattern) {
      case HapticPattern.LIGHT:
      case HapticPattern.SELECTION:
        await hapticFeedback.selectionChanged();
        break;
      case HapticPattern.MEDIUM:
      case HapticPattern.WARNING:
        await hapticFeedback.impactOccurred('medium');
        break;
      case HapticPattern.HEAVY:
      case HapticPattern.ERROR:
        await hapticFeedback.impactOccurred('heavy');
        break;
      case HapticPattern.SUCCESS:
        await hapticFeedback.notificationOccurred('success');
        break;
      case HapticPattern.NOTIFICATION_WARNING:
        await hapticFeedback.notificationOccurred('warning');
        break;
      case HapticPattern.NOTIFICATION_ERROR:
        await hapticFeedback.notificationOccurred('error');
        break;
      default:
        await hapticFeedback.impactOccurred('light');
    }
  }

  private getVibrationPattern(pattern: HapticPattern): number | number[] | null {
    switch (pattern) {
      case HapticPattern.LIGHT:
      case HapticPattern.SELECTION:
        return 10;
      case HapticPattern.MEDIUM:
        return 25;
      case HapticPattern.HEAVY:
        return 50;
      case HapticPattern.SUCCESS:
        return [10, 50, 10];
      case HapticPattern.WARNING:
        return [25, 100, 25];
      case HapticPattern.ERROR:
        return [50, 100, 50, 100, 50];
      case HapticPattern.IMPACT_LIGHT:
        return 15;
      case HapticPattern.IMPACT_MEDIUM:
        return 30;
      case HapticPattern.IMPACT_HEAVY:
        return 60;
      case HapticPattern.NOTIFICATION_SUCCESS:
        return [20, 50, 20, 50, 20];
      case HapticPattern.NOTIFICATION_WARNING:
        return [30, 100, 30];
      case HapticPattern.NOTIFICATION_ERROR:
        return [50, 100, 50, 100, 50, 100, 50];
      default:
        return null;
    }
  }

  private simulateHaptic(pattern: HapticPattern): void {
    // For devices without haptic support, we can provide visual/audio feedback
    const event = new CustomEvent('haptic-simulation', {
      detail: { pattern }
    });
    window.dispatchEvent(event);
  }
}

// Global haptic manager instance
const hapticManager = new HapticManager();

// React hook for haptic feedback
export const useHapticFeedback = () => {
  const triggeredPatterns = useRef<Set<string>>(new Set());

  const triggerHaptic = useCallback(async (pattern: HapticPattern, options?: {
    skipDuplicates?: boolean;
    duration?: number;
  }) => {
    const { skipDuplicates = false, duration = 1000 } = options || {};
    
    // Skip if duplicate and skipDuplicates is enabled
    if (skipDuplicates) {
      const key = `${pattern}-${Date.now()}`;
      if (triggeredPatterns.current.has(pattern)) {
        return;
      }
      triggeredPatterns.current.add(pattern);
      
      // Clean up after duration
      setTimeout(() => {
        triggeredPatterns.current.delete(pattern);
      }, duration);
    }

    await hapticManager.triggerHaptic(pattern);
  }, []);

  const isSupported = useCallback(() => {
    return hapticManager.isHapticSupported();
  }, []);

  const isEnabled = useCallback(() => {
    return hapticManager.isHapticEnabled();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    hapticManager.setEnabled(enabled);
  }, []);

  return {
    triggerHaptic,
    isSupported,
    isEnabled,
    setEnabled,
    patterns: HapticPattern
  };
};

// Quick haptic trigger functions for common patterns
export const useQuickHaptics = () => {
  const { triggerHaptic } = useHapticFeedback();

  return {
    onTap: () => triggerHaptic(HapticPattern.LIGHT),
    onPress: () => triggerHaptic(HapticPattern.MEDIUM),
    onLongPress: () => triggerHaptic(HapticPattern.HEAVY),
    onSuccess: () => triggerHaptic(HapticPattern.SUCCESS),
    onError: () => triggerHaptic(HapticPattern.ERROR),
    onWarning: () => triggerHaptic(HapticPattern.WARNING),
    onSelection: () => triggerHaptic(HapticPattern.SELECTION),
    onSwipe: () => triggerHaptic(HapticPattern.LIGHT),
    onPullToRefresh: () => triggerHaptic(HapticPattern.MEDIUM),
    onTaskComplete: () => triggerHaptic(HapticPattern.NOTIFICATION_SUCCESS),
    onTaskDelete: () => triggerHaptic(HapticPattern.NOTIFICATION_WARNING),
    onVirtualScrollActivate: () => triggerHaptic(HapticPattern.NOTIFICATION_SUCCESS),
    onModeSwitch: () => triggerHaptic(HapticPattern.IMPACT_MEDIUM),
    onErrorRecovery: () => triggerHaptic(HapticPattern.NOTIFICATION_SUCCESS)
  };
};

// Haptic feedback context for batch operations
export const useHapticSequence = () => {
  const { triggerHaptic } = useHapticFeedback();

  const playSequence = useCallback(async (sequence: {
    pattern: HapticPattern;
    delay?: number;
  }[]) => {
    for (let i = 0; i < sequence.length; i++) {
      const { pattern, delay = 100 } = sequence[i];
      await triggerHaptic(pattern);
      
      if (i < sequence.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [triggerHaptic]);

  // Pre-defined sequences for common interactions
  const sequences = {
    taskComplete: [
      { pattern: HapticPattern.LIGHT, delay: 0 },
      { pattern: HapticPattern.SUCCESS, delay: 200 }
    ],
    performanceBoost: [
      { pattern: HapticPattern.MEDIUM, delay: 0 },
      { pattern: HapticPattern.IMPACT_LIGHT, delay: 100 },
      { pattern: HapticPattern.NOTIFICATION_SUCCESS, delay: 200 }
    ],
    errorRecovery: [
      { pattern: HapticPattern.WARNING, delay: 0 },
      { pattern: HapticPattern.LIGHT, delay: 300 },
      { pattern: HapticPattern.SUCCESS, delay: 600 }
    ],
    modeSwitch: [
      { pattern: HapticPattern.MEDIUM, delay: 0 },
      { pattern: HapticPattern.IMPACT_MEDIUM, delay: 400 }
    ]
  };

  return {
    playSequence,
    sequences
  };
};

// Gesture-based haptic feedback
export const useGestureHaptics = () => {
  const { triggerHaptic } = useHapticFeedback();

  const onSwipeStart = useCallback(() => {
    triggerHaptic(HapticPattern.LIGHT);
  }, [triggerHaptic]);

  const onSwipeThreshold = useCallback((direction: 'left' | 'right') => {
    const pattern = direction === 'right' ? HapticPattern.SUCCESS : HapticPattern.WARNING;
    triggerHaptic(pattern);
  }, [triggerHaptic]);

  const onSwipeComplete = useCallback((action: 'complete' | 'delete' | 'edit') => {
    const patterns = {
      complete: HapticPattern.NOTIFICATION_SUCCESS,
      delete: HapticPattern.NOTIFICATION_WARNING,
      edit: HapticPattern.SELECTION
    };
    triggerHaptic(patterns[action]);
  }, [triggerHaptic]);

  const onPinchStart = useCallback(() => {
    triggerHaptic(HapticPattern.LIGHT);
  }, [triggerHaptic]);

  const onPinchThreshold = useCallback(() => {
    triggerHaptic(HapticPattern.MEDIUM);
  }, [triggerHaptic]);

  const onLongPress = useCallback((duration: number) => {
    // Escalating haptic feedback based on press duration
    if (duration > 500) {
      triggerHaptic(HapticPattern.MEDIUM);
    }
    if (duration > 1000) {
      triggerHaptic(HapticPattern.HEAVY);
    }
  }, [triggerHaptic]);

  return {
    onSwipeStart,
    onSwipeThreshold,
    onSwipeComplete,
    onPinchStart,
    onPinchThreshold,
    onLongPress
  };
};

// Performance monitoring for haptic feedback
export const useHapticPerformanceMonitor = () => {
  const performanceRef = useRef({
    triggeredCount: 0,
    lastTriggerTime: 0,
    averageInterval: 0
  });

  useEffect(() => {
    const handleHaptic = () => {
      const now = Date.now();
      const perf = performanceRef.current;
      
      if (perf.lastTriggerTime > 0) {
        const interval = now - perf.lastTriggerTime;
        perf.averageInterval = (perf.averageInterval * perf.triggeredCount + interval) / (perf.triggeredCount + 1);
      }
      
      perf.triggeredCount++;
      perf.lastTriggerTime = now;
    };

    // Listen for haptic events (could be extended to track actual haptic calls)
    window.addEventListener('haptic-trigger', handleHaptic);
    
    return () => {
      window.removeEventListener('haptic-trigger', handleHaptic);
    };
  }, []);

  const getMetrics = useCallback(() => {
    return {
      ...performanceRef.current,
      isOptimal: performanceRef.current.averageInterval > 50 // Not too frequent
    };
  }, []);

  return { getMetrics };
};

export default hapticManager;