import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from 'react-spring';
import { useHapticFeedback, useQuickHaptics, useGestureHaptics, HapticPattern } from '../../lib/hapticFeedback';
import { Check, Trash2, Edit3, Star, Zap, ArrowLeft, ArrowRight } from 'lucide-react';

interface MobileTaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  };
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: 'low' | 'medium' | 'high') => void;
  isVirtualized?: boolean;
  index?: number;
}

export const MobileTaskCard: React.FC<MobileTaskCardProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  onPriorityChange,
  isVirtualized = false,
  index = 0
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [swipeState, setSwipeState] = useState<'idle' | 'completing' | 'deleting'>('idle');
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [showSwipeHints, setShowSwipeHints] = useState(false);
  
  // Haptic feedback hooks
  const { triggerHaptic } = useHapticFeedback();
  const quickHaptics = useQuickHaptics();
  const gestureHaptics = useGestureHaptics();
  
  // Touch and gesture state
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const [lastTap, setLastTap] = useState(0);
  
  // Animation values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const scale = useMotionValue(1);
  
  // Spring animations for smooth interactions
  const [springProps, setSpringProps] = useSpring(() => ({
    scale: 1,
    rotateZ: 0,
    config: { tension: 300, friction: 30 }
  }));

  // Mobile-optimized swipe thresholds
  const swipeThresholds = {
    activate: 60,
    complete: 120,
    velocity: 0.5
  };

  // Priority colors optimized for mobile contrast
  const priorityColors = {
    low: { bg: 'from-emerald-400 to-emerald-600', text: 'text-emerald-600' },
    medium: { bg: 'from-amber-400 to-orange-500', text: 'text-amber-600' },
    high: { bg: 'from-red-400 to-red-600', text: 'text-red-600' }
  };

  // Touch gesture handler with haptic feedback
  const bind = useGesture({
    onDrag: ({ offset: [ox], velocity: [vx], direction: [dx], active, event }) => {
      // Prevent default touch behaviors
      event?.preventDefault();
      
      x.set(ox);
      
      if (active) {
        // Haptic feedback on swipe threshold
        if (Math.abs(ox) > swipeThresholds.activate && swipeState === 'idle') {
          gestureHaptics.onSwipeThreshold(ox > 0 ? 'right' : 'left');
          setSwipeState(ox > 0 ? 'completing' : 'deleting');
        }
        
        // Reset state if swiping back
        if (Math.abs(ox) < swipeThresholds.activate && swipeState !== 'idle') {
          setSwipeState('idle');
        }
      } else {
        // Handle swipe completion
        const shouldComplete = Math.abs(ox) > swipeThresholds.complete || Math.abs(vx) > swipeThresholds.velocity;
        
        if (shouldComplete) {
          if (ox > 0) {
            gestureHaptics.onSwipeComplete('complete');
            onToggle(task.id);
          } else {
            gestureHaptics.onSwipeComplete('delete');
            onDelete(task.id);
          }
        }
        
        // Reset position
        x.set(0);
        setSwipeState('idle');
      }
    },
    
    onPinch: ({ offset: [scale], active }) => {
      if (active) {
        setSpringProps({ scale: 1 + scale * 0.1 });
        
        if (scale > 0.3) {
          gestureHaptics.onPinchThreshold();
          onEdit(task.id);
        }
      } else {
        setSpringProps({ scale: 1 });
      }
    },
    
    onMove: ({ xy: [px, py], active }) => {
      if (active && isPressed) {
        // Subtle parallax effect for depth
        y.set((py - window.innerHeight / 2) * 0.01);
      }
    }
  }, {
    drag: {
      axis: 'x',
      bounds: { left: -200, right: 200 },
      rubberband: true,
      threshold: 10
    },
    pinch: {
      threshold: 0.1
    }
  });

  // Long press handler with progressive haptic feedback
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsPressed(true);
    quickHaptics.onTap();
    
    // Double tap detection
    const now = Date.now();
    if (now - lastTap < 300) {
      onToggle(task.id);
      quickHaptics.onSuccess();
      return;
    }
    setLastTap(now);
    
    // Long press timer with progressive feedback
    let progress = 0;
    longPressTimerRef.current = setInterval(() => {
      progress += 100;
      setLongPressProgress(progress);
      
      if (progress === 500) {
        gestureHaptics.onLongPress(500);
      } else if (progress === 1000) {
        gestureHaptics.onLongPress(1000);
        setShowSwipeHints(true);
        setTimeout(() => setShowSwipeHints(false), 3000);
      } else if (progress >= 1500) {
        clearInterval(longPressTimerRef.current);
        setLongPressProgress(0);
        quickHaptics.onPress();
        onEdit(task.id);
      }
    }, 100);
  }, [lastTap, onToggle, onEdit, task.id, quickHaptics, gestureHaptics]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    setLongPressProgress(0);
    if (longPressTimerRef.current) {
      clearInterval(longPressTimerRef.current);
    }
  }, []);

  // Priority cycling with haptic feedback
  const cyclePriority = useCallback(() => {
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    
    quickHaptics.onSelection();
    onPriorityChange(task.id, nextPriority);
  }, [task.priority, task.id, onPriorityChange, quickHaptics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearInterval(longPressTimerRef.current);
      }
    };
  }, []);

  // Show hints for first few tasks
  useEffect(() => {
    if (index < 2 && !task.completed && !isVirtualized) {
      const timer = setTimeout(() => {
        setShowSwipeHints(true);
        setTimeout(() => setShowSwipeHints(false), 4000);
      }, 2000 + index * 1000);
      return () => clearTimeout(timer);
    }
  }, [index, task.completed, isVirtualized]);

  return (
    <div className="relative">
      {/* Swipe action backgrounds */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        {/* Complete action (right swipe) */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-start pl-6"
          style={{
            opacity: useTransform(x, [0, swipeThresholds.activate, swipeThresholds.complete], [0, 0.7, 1]),
            scale: useTransform(x, [0, swipeThresholds.complete], [0.8, 1])
          }}
        >
          <motion.div
            animate={swipeState === 'completing' ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Check className="h-6 w-6 text-white" />
          </motion.div>
          <span className="ml-3 text-white font-medium">Complete</span>
        </motion.div>

        {/* Delete action (left swipe) */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-l from-red-500 to-red-600 flex items-center justify-end pr-6"
          style={{
            opacity: useTransform(x, [-swipeThresholds.complete, -swipeThresholds.activate, 0], [1, 0.7, 0]),
            scale: useTransform(x, [-swipeThresholds.complete, 0], [1, 0.8])
          }}
        >
          <span className="mr-3 text-white font-medium">Delete</span>
          <motion.div
            animate={swipeState === 'deleting' ? { rotate: -360, scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Trash2 className="h-6 w-6 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Main task card */}
      <animated.div style={springProps}>
        <motion.div
          ref={cardRef}
          {...bind()}
          style={{ x, y, rotate, opacity, scale }}
          className={`
            relative bg-card border border-border rounded-xl p-4 shadow-sm
            cursor-pointer select-none touch-none
            ${task.completed ? 'opacity-60' : ''}
            ${isPressed ? 'shadow-lg' : ''}
            ${isVirtualized ? 'virtual-optimized' : ''}
          `}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          whileTap={{ scale: 0.98 }}
          animate={{
            borderColor: isPressed ? 'rgba(59, 130, 246, 0.5)' : 'rgba(226, 232, 240, 1)',
            boxShadow: isPressed 
              ? '0 10px 25px rgba(59, 130, 246, 0.2)' 
              : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Long press progress indicator */}
          <AnimatePresence>
            {longPressProgress > 0 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: longPressProgress / 1500 }}
                exit={{ scaleX: 0 }}
                className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-xl origin-left"
                style={{ width: '100%' }}
              />
            )}
          </AnimatePresence>

          {/* Virtual scrolling indicator */}
          {isVirtualized && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"
              title="Optimized for performance"
            />
          )}

          {/* Content */}
          <div className="flex items-start gap-4">
            {/* Checkbox with enhanced touch target */}
            <motion.button
              className={`
                relative mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center
                touch-manipulation min-h-[44px] min-w-[44px] flex-shrink-0
                ${task.completed 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-muted-foreground active:border-primary'
                }
              `}
              onTouchStart={(e) => {
                e.stopPropagation();
                quickHaptics.onTap();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onToggle(task.id);
                quickHaptics.onTaskComplete();
              }}
              whileTap={{ scale: 0.9 }}
              animate={task.completed ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence>
                {task.completed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-4 w-4 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <motion.h3
                className={`font-medium text-base leading-tight ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}
                animate={task.completed ? { opacity: 0.6 } : { opacity: 1 }}
              >
                {task.title}
              </motion.h3>
              
              {task.description && (
                <motion.p
                  className="text-sm text-muted-foreground mt-1 line-clamp-2"
                  animate={task.completed ? { opacity: 0.4 } : { opacity: 0.7 }}
                >
                  {task.description}
                </motion.p>
              )}

              {task.dueDate && (
                <motion.div
                  className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-1 h-1 rounded-full bg-current" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </motion.div>
              )}
            </div>

            {/* Priority indicator with enhanced touch target */}
            <motion.button
              className={`
                relative w-8 h-8 rounded-full bg-gradient-to-r ${priorityColors[task.priority].bg}
                flex items-center justify-center touch-manipulation min-h-[44px] min-w-[44px]
                shadow-sm active:shadow-md
              `}
              onTouchStart={(e) => {
                e.stopPropagation();
                quickHaptics.onTap();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                cyclePriority();
              }}
              whileTap={{ scale: 0.9 }}
              animate={isPressed ? { rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              {/* Priority pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white opacity-20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="w-2 h-2 bg-white rounded-full" />
            </motion.button>
          </div>

          {/* Performance badge for virtualized items */}
          {isVirtualized && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-2 right-2 flex items-center gap-1 bg-blue-500/10 text-blue-600 text-xs px-2 py-1 rounded-full"
            >
              <Zap className="h-3 w-3" />
              <span>Fast</span>
            </motion.div>
          )}
        </motion.div>
      </animated.div>

      {/* Swipe hints overlay */}
      <AnimatePresence>
        {showSwipeHints && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-between px-4"
          >
            {/* Left swipe hint */}
            <motion.div
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-2"
              animate={{ x: [0, -15, 0] }}
              transition={{ duration: 1.5, repeat: 2 }}
            >
              <ArrowLeft className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-600 font-medium">Swipe to delete</span>
            </motion.div>

            {/* Right swipe hint */}
            <motion.div
              className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-2"
              animate={{ x: [0, 15, 0] }}
              transition={{ duration: 1.5, repeat: 2, delay: 0.5 }}
            >
              <span className="text-xs text-emerald-600 font-medium">Swipe to complete</span>
              <ArrowRight className="h-4 w-4 text-emerald-600" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task completion celebration */}
      <AnimatePresence>
        {task.completed && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2 -right-2 pointer-events-none"
          >
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: 2 }}
            >
              <Star className="h-6 w-6 text-yellow-500 fill-current" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};