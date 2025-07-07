# 📚 Developer Reference: Haptic & Gesture APIs

## Quick Reference Guide for Implementation

---

## 🎯 **Core Haptic API**

### **Basic Usage**

```typescript
import { useHapticFeedback, HapticPattern } from '@/lib/hapticFeedback';

const MyComponent = () => {
  const { triggerHaptic, isSupported, isEnabled } = useHapticFeedback();
  
  const handleClick = () => {
    triggerHaptic(HapticPattern.MEDIUM);
  };
  
  return (
    <button onClick={handleClick}>
      Click me {isSupported() ? '(with haptics)' : ''}
    </button>
  );
};
```

### **Available Haptic Patterns**

```typescript
enum HapticPattern {
  // Basic intensity levels
  LIGHT = 'light',              // Gentle tap, selection
  MEDIUM = 'medium',            // Button press, confirmation  
  HEAVY = 'heavy',              // Long press, important action
  
  // Contextual feedback
  SUCCESS = 'success',          // Task completion, positive action
  WARNING = 'warning',          // Caution, reversible action
  ERROR = 'error',              // Failed action, critical alert
  SELECTION = 'selection',      // Item picking, navigation
  
  // iOS-specific impacts
  IMPACT_LIGHT = 'impactLight',
  IMPACT_MEDIUM = 'impactMedium', 
  IMPACT_HEAVY = 'impactHeavy',
  
  // iOS-specific notifications
  NOTIFICATION_SUCCESS = 'notificationSuccess',
  NOTIFICATION_WARNING = 'notificationWarning',
  NOTIFICATION_ERROR = 'notificationError'
}
```

### **Advanced Haptic Usage**

```typescript
// Quick haptic shortcuts
const { onTap, onPress, onSuccess, onError } = useQuickHaptics();

// Haptic sequences for complex feedback
const { playSequence, sequences } = useHapticSequence();

// Play a custom sequence
await playSequence([
  { pattern: HapticPattern.MEDIUM, delay: 0 },
  { pattern: HapticPattern.SUCCESS, delay: 200 }
]);

// Use pre-defined sequences
await playSequence(sequences.taskComplete);
```

---

## 🎮 **Gesture API Reference**

### **Swipe Gestures**

```typescript
import { useSwipeGesture } from '@/lib/gestureUtils';

const SwipeableItem = () => {
  const { bind, style, animated: AnimatedDiv } = useSwipeGesture({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    threshold: 0.3, // 30% of container width
    velocityThreshold: 0.5,
    enabled: true
  });
  
  return (
    <AnimatedDiv {...bind()} style={style}>
      Swipe me!
    </AnimatedDiv>
  );
};
```

### **Long Press Gestures**

```typescript
import { useLongPress } from '@/lib/gestureUtils';

const LongPressButton = () => {
  const { bind, style, isPressed } = useLongPress({
    onLongPress: () => console.log('Long pressed!'),
    duration: 500, // ms
    enabled: true
  });
  
  return (
    <animated.button 
      {...bind()} 
      style={style}
      className={isPressed ? 'pressed' : ''}
    >
      Hold me
    </animated.button>
  );
};
```

### **Pull-to-Refresh**

```typescript
import { usePullToRefresh } from '@/lib/gestureUtils';

const RefreshableList = () => {
  const { bind, style, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      await fetchNewData();
    },
    threshold: 80,
    maxPull: 150,
    enabled: true
  });
  
  return (
    <animated.div {...bind()} style={style}>
      {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
      {/* List content */}
    </animated.div>
  );
};
```

---

## 📱 **Mobile-Specific Components**

### **Mobile Task Card**

```typescript
import { MobileTaskCard } from '@/components/ui/mobile-task-card';

<MobileTaskCard
  task={task}
  onToggle={(id) => toggleTask(id)}
  onEdit={(id) => editTask(id)}
  onDelete={(id) => deleteTask(id)}
  onPriorityChange={(id, priority) => changePriority(id, priority)}
  isVirtualized={isVirtual}
  index={index}
/>
```

### **Mobile Pull-to-Refresh**

```typescript
import { MobilePullToRefresh } from '@/components/ui/mobile-pull-to-refresh';

<MobilePullToRefresh
  onRefresh={async () => await refreshTasks()}
  isRefreshing={isLoading}
  threshold={80}
  maxPull={150}
>
  <TaskList tasks={tasks} />
</MobilePullToRefresh>
```

### **Mobile Floating Action Button**

```typescript
import { MobileFloatingActionButton } from '@/components/MobileFloatingActionButton';

<MobileFloatingActionButton
  onCreateTask={() => openTaskDialog()}
  onQuickActions={{
    addDueDate: () => openDueDatePicker(),
    addReminder: () => openReminderDialog(),
    addCategory: () => openCategoryPicker(),
    addFromTemplate: () => openTemplateDialog()
  }}
/>
```

---

## ⚙️ **Configuration Options**

### **Gesture Configuration**

```typescript
export const GESTURE_CONFIG = {
  // Swipe thresholds
  SWIPE_THRESHOLD: 0.3,           // 30% of container width
  SWIPE_VELOCITY_THRESHOLD: 0.2,  // Minimum velocity for swipe
  SWIPE_MIN_DISTANCE: 50,         // Minimum pixel distance
  
  // Pull to refresh
  PULL_THRESHOLD: 80,             // Pixels to trigger refresh
  PULL_MAX: 120,                  // Maximum pull distance
  
  // Long press
  LONG_PRESS_DURATION: 500,       // ms to trigger long press
  
  // Touch feedback
  TOUCH_SCALE: 0.95,              // Scale factor for press animation
  HAPTIC_FEEDBACK: true,          // Enable haptic feedback
};
```

### **Haptic Manager Configuration**

```typescript
const hapticManager = new HapticManager({
  throttleInterval: 50,           // ms between haptics
  enabledByDefault: true,         // Default haptic state
  batteryOptimization: true,      // Auto-optimize for low battery
  performanceMonitoring: true     // Monitor and adapt to performance
});
```

---

## 🔧 **Utility Functions**

### **Platform Detection**

```typescript
import { isMobileDevice, getTouchTargetSize } from '@/lib/gestureUtils';

if (isMobileDevice()) {
  // Mobile-specific logic
}

const buttonSize = getTouchTargetSize(32); // Ensures minimum 44px on mobile
```

### **Haptic Testing (Development)**

```typescript
// Available in development mode
if (process.env.NODE_ENV === 'development') {
  // Test individual patterns
  window.testHaptics.testPattern(HapticPattern.SUCCESS);
  
  // Test sequences
  window.testHaptics.testSequence([
    { pattern: HapticPattern.MEDIUM, delay: 0 },
    { pattern: HapticPattern.SUCCESS, delay: 200 }
  ]);
  
  // Get performance metrics
  const metrics = window.testHaptics.getMetrics();
}
```

### **Performance Monitoring**

```typescript
import { useHapticPerformanceMonitor } from '@/lib/hapticFeedback';

const PerformanceAwareComponent = () => {
  const { getMetrics } = useHapticPerformanceMonitor();
  
  useEffect(() => {
    const metrics = getMetrics();
    console.log('Haptic performance:', metrics);
  }, []);
};
```

---

## 🎨 **CSS Classes for Mobile**

### **Touch Targets**

```css
/* Minimum touch target sizes */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Touch feedback animation */
.touch-feedback {
  transition: transform 0.1s ease-out;
}

.touch-feedback:active {
  transform: scale(0.95);
}
```

### **Safe Area Support**

```css
/* Safe area classes */
.safe-area-pt { padding-top: env(safe-area-inset-top); }
.safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }
.safe-area-pl { padding-left: env(safe-area-inset-left); }
.safe-area-pr { padding-right: env(safe-area-inset-right); }
```

### **Haptic Feedback Simulation**

```css
/* Visual haptic feedback for devices without haptics */
.haptic-light { animation: haptic-light 0.1s ease-out; }
.haptic-medium { animation: haptic-medium 0.15s ease-out; }
.haptic-heavy { animation: haptic-heavy 0.2s ease-out; }

@keyframes haptic-light {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
```

---

## 🚀 **Best Practices**

### **1. Haptic Feedback Guidelines**

```typescript
// ✅ Good: Contextual haptic patterns
triggerHaptic(HapticPattern.SUCCESS); // For positive actions
triggerHaptic(HapticPattern.WARNING); // For destructive actions
triggerHaptic(HapticPattern.LIGHT);   // For selections/taps

// ❌ Bad: Generic haptic for everything
triggerHaptic(HapticPattern.MEDIUM); // For all interactions
```

### **2. Gesture Implementation**

```typescript
// ✅ Good: Progressive feedback
onDrag: ({ offset, active }) => {
  if (active && reachedThreshold) {
    triggerHaptic(HapticPattern.MEDIUM); // "Action available"
  } else if (!active && actionCompleted) {
    triggerHaptic(HapticPattern.SUCCESS); // "Action completed"
  }
}

// ❌ Bad: No progressive feedback
onDrag: ({ offset, active }) => {
  if (!active) {
    triggerHaptic(HapticPattern.LIGHT); // Too late, no guidance
  }
}
```

### **3. Performance Optimization**

```typescript
// ✅ Good: Throttled haptics with cleanup
useEffect(() => {
  const cleanup = setupGestures();
  return cleanup; // Always cleanup
}, []);

// ✅ Good: Conditional haptics
if (hapticManager.isHapticEnabled() && !hapticManager.isThrottled()) {
  triggerHaptic(pattern);
}

// ❌ Bad: No throttling or cleanup
triggerHaptic(HapticPattern.LIGHT); // Every render
```

### **4. Accessibility**

```typescript
// ✅ Good: Respect user preferences
const { triggerHaptic } = useHapticFeedback();

if (userPrefersReducedMotion) {
  // Skip haptic, use visual feedback only
  showVisualFeedback();
} else {
  triggerHaptic(HapticPattern.SUCCESS);
}

// ✅ Good: Provide alternatives
<button 
  onClick={handleClick}
  aria-label="Complete task"
  className="touch-target" // Minimum size
>
  {isHapticSupported() ? '✓ Tap' : '✓ Complete'}
</button>
```

---

## 📋 **Integration Checklist**

### **For New Components**

- [ ] Add minimum 44px touch targets on mobile
- [ ] Implement appropriate haptic feedback for all interactions
- [ ] Test on iOS, Android, and desktop
- [ ] Ensure cleanup of all timers and listeners
- [ ] Respect `prefers-reduced-motion` setting
- [ ] Provide visual feedback fallbacks
- [ ] Test with haptics disabled
- [ ] Monitor performance impact

### **For Gesture Implementation**

- [ ] Progressive haptic feedback (threshold → completion)
- [ ] Visual coordination (haptic timing matches animation)
- [ ] Intelligent thresholds (distance + velocity)
- [ ] Proper cleanup on unmount
- [ ] Error handling for gesture failures
- [ ] Platform-specific optimizations
- [ ] Accessibility considerations

This reference provides everything needed to implement and extend the haptic and gesture systems! 🎉