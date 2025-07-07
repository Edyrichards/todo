import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { useHapticFeedback, useQuickHaptics, HapticPattern } from '../../lib/hapticFeedback';
import { RefreshCcw, ArrowDown, Check, Zap, Sparkles } from 'lucide-react';

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  isRefreshing: boolean;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

export const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({
  onRefresh,
  children,
  isRefreshing,
  threshold = 80,
  maxPull = 150,
  disabled = false
}) => {
  const [pullState, setPullState] = useState<'idle' | 'pulling' | 'ready' | 'refreshing' | 'complete'>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Haptic feedback
  const { triggerHaptic } = useHapticFeedback();
  const quickHaptics = useQuickHaptics();
  
  // Animation values
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const scrollTop = useRef(0);
  
  // Transform animations
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const iconRotation = useTransform(y, [0, threshold, maxPull], [0, 180, 360]);
  const iconScale = useTransform(y, [0, threshold * 0.5, threshold], [0, 0.8, 1]);
  const backgroundOpacity = useTransform(y, [0, threshold], [0, 0.1]);
  
  // Spring animation for smooth pull
  const [springProps, setSpringProps] = useSpring(() => ({
    pullDistance: 0,
    config: { tension: 200, friction: 25 }
  }));

  // Check if we can pull to refresh (at top of scroll)
  const canPullToRefresh = useCallback(() => {
    if (disabled || isRefreshing) return false;
    
    const container = containerRef.current;
    if (!container) return false;
    
    return container.scrollTop <= 0;
  }, [disabled, isRefreshing]);

  // Handle touch start
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!canPullToRefresh()) return;
    
    const touch = event.touches[0];
    startY.current = touch.clientY;
    scrollTop.current = containerRef.current?.scrollTop || 0;
  }, [canPullToRefresh]);

  // Handle touch move with progressive haptic feedback
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!canPullToRefresh() || startY.current === 0) return;
    
    const touch = event.touches[0];
    const deltaY = touch.clientY - startY.current;
    
    // Only allow pulling down
    if (deltaY <= 0) return;
    
    // Apply resistance to pull
    const resistance = Math.min(deltaY / 3, maxPull);
    y.set(resistance);
    setSpringProps({ pullDistance: resistance });
    
    // State transitions with haptic feedback
    if (resistance >= threshold && pullState !== 'ready') {
      setPullState('ready');
      triggerHaptic(HapticPattern.MEDIUM);
    } else if (resistance < threshold && pullState === 'ready') {
      setPullState('pulling');
      triggerHaptic(HapticPattern.LIGHT);
    } else if (resistance > 10 && pullState === 'idle') {
      setPullState('pulling');
      triggerHaptic(HapticPattern.LIGHT);
    }
    
    // Progressive haptic feedback at intervals
    if (resistance > 0 && resistance % 20 === 0) {
      triggerHaptic(HapticPattern.SELECTION);
    }
    
    // Prevent scrolling while pulling
    if (resistance > 10) {
      event.preventDefault();
    }
  }, [canPullToRefresh, maxPull, threshold, pullState, triggerHaptic, y, setSpringProps]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (startY.current === 0) return;
    
    const currentPull = y.get();
    startY.current = 0;
    
    if (currentPull >= threshold && pullState === 'ready') {
      // Trigger refresh
      setPullState('refreshing');
      triggerHaptic(HapticPattern.SUCCESS);
      
      try {
        await onRefresh();
        setPullState('complete');
        setShowSuccess(true);
        triggerHaptic(HapticPattern.NOTIFICATION_SUCCESS);
        
        // Show success state briefly
        setTimeout(() => {
          setShowSuccess(false);
          setPullState('idle');
        }, 1500);
      } catch (error) {
        setPullState('idle');
        triggerHaptic(HapticPattern.ERROR);
      }
    } else {
      // Snap back
      setPullState('idle');
    }
    
    // Animate back to position
    y.set(0);
    setSpringProps({ pullDistance: 0 });
  }, [threshold, pullState, triggerHaptic, onRefresh, y, setSpringProps]);

  // Update state when external refreshing changes
  useEffect(() => {
    if (isRefreshing && pullState !== 'refreshing') {
      setPullState('refreshing');
    } else if (!isRefreshing && pullState === 'refreshing') {
      setPullState('complete');
      setShowSuccess(true);
      quickHaptics.onSuccess();
      
      setTimeout(() => {
        setShowSuccess(false);
        setPullState('idle');
      }, 1500);
    }
  }, [isRefreshing, pullState, quickHaptics]);

  // Get current state colors and content
  const getStateConfig = () => {
    switch (pullState) {
      case 'pulling':
        return {
          color: 'text-blue-500',
          bgColor: 'from-blue-500/20 to-blue-600/20',
          message: 'Pull to refresh',
          icon: ArrowDown
        };
      case 'ready':
        return {
          color: 'text-emerald-500',
          bgColor: 'from-emerald-500/20 to-emerald-600/20',
          message: 'Release to refresh',
          icon: RefreshCcw
        };
      case 'refreshing':
        return {
          color: 'text-blue-500',
          bgColor: 'from-blue-500/20 to-blue-600/20',
          message: 'Refreshing...',
          icon: RefreshCcw
        };
      case 'complete':
        return {
          color: 'text-emerald-500',
          bgColor: 'from-emerald-500/20 to-emerald-600/20',
          message: 'Refreshed!',
          icon: Check
        };
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'from-muted/20 to-muted/20',
          message: 'Pull to refresh',
          icon: ArrowDown
        };
    }
  };

  const stateConfig = getStateConfig();
  const StateIcon = stateConfig.icon;

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center"
        style={{
          height: useTransform(y, [0, maxPull], [0, 100]),
          opacity: backgroundOpacity
        }}
      >
        <motion.div
          className={`bg-gradient-to-r ${stateConfig.bgColor} backdrop-blur-sm rounded-full p-4 border border-white/20 shadow-lg`}
          style={{ scale: iconScale }}
          animate={{
            boxShadow: pullState === 'ready' || pullState === 'refreshing'
              ? '0 8px 25px rgba(59, 130, 246, 0.3)'
              : '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              style={{ rotate: iconRotation }}
              animate={pullState === 'refreshing' ? { rotate: 360 } : {}}
              transition={pullState === 'refreshing' ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              className={stateConfig.color}
            >
              <StateIcon className="h-5 w-5" />
            </motion.div>
            
            <span className={`text-sm font-medium ${stateConfig.color}`}>
              {stateConfig.message}
            </span>
            
            {/* Progress indicator */}
            <motion.div
              className="w-8 h-1 bg-white/20 rounded-full overflow-hidden"
              style={{ opacity: pullState === 'pulling' || pullState === 'ready' ? 1 : 0 }}
            >
              <motion.div
                className={`h-full bg-gradient-to-r ${stateConfig.bgColor} rounded-full`}
                style={{ width: useTransform(pullProgress, [0, 1], ['0%', '100%']) }}
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Success celebration */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
          >
            <motion.div
              className="bg-emerald-500 text-white rounded-full p-3 shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: 1 }}
            >
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Refreshed!</span>
              </div>
            </motion.div>
            
            {/* Celebration particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  scale: 0
                }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 6) * 30,
                  y: Math.sin((i * Math.PI * 2) / 6) * 30,
                  opacity: 0,
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
                style={{
                  left: '50%',
                  top: '50%',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content container */}
      <animated.div
        ref={containerRef}
        style={{
          transform: springProps.pullDistance.to(d => `translateY(${d}px)`),
        }}
        className="h-full overflow-auto overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </animated.div>

      {/* Visual feedback for pull state */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        style={{
          opacity: useTransform(y, [0, threshold], [0, 0.8]),
          scaleY: useTransform(y, [0, threshold], [0, 1])
        }}
      />
    </div>
  );
};

// Enhanced mobile performance with haptic feedback
interface MobilePerformanceIndicatorProps {
  isVisible: boolean;
  metrics: {
    renderTime: number;
    taskCount: number;
    memoryUsage: number;
    isVirtual: boolean;
  };
}

export const MobilePerformanceIndicator: React.FC<MobilePerformanceIndicatorProps> = ({
  isVisible,
  metrics
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  const handleToggle = () => {
    triggerHaptic(HapticPattern.SELECTION);
    setShowDetails(!showDetails);
  };

  const performanceScore = Math.max(0, Math.min(100, 100 - (metrics.renderTime * 2)));
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 right-4 z-40"
        >
          <motion.button
            onClick={handleToggle}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 shadow-lg touch-manipulation min-h-[56px] min-w-[56px]"
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: [
                '0 4px 15px rgba(59, 130, 246, 0.3)',
                '0 8px 25px rgba(59, 130, 246, 0.5)',
                '0 4px 15px rgba(59, 130, 246, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: metrics.isVirtual ? 360 : 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="h-6 w-6" />
            </motion.div>
          </motion.button>

          {/* Expandable details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute bottom-16 right-0 bg-background/95 backdrop-blur-lg border border-border rounded-xl p-4 shadow-xl min-w-[200px]"
              >
                <div className="space-y-3">
                  {/* Performance score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Performance</span>
                    <span className={`text-sm font-bold ${
                      performanceScore > 80 ? 'text-emerald-500' : 
                      performanceScore > 60 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {Math.round(performanceScore)}%
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Tasks:</span>
                      <span className="font-mono">{metrics.taskCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Render:</span>
                      <span className="font-mono">{metrics.renderTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span className="font-mono">{metrics.memoryUsage.toFixed(1)}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className={`font-medium ${metrics.isVirtual ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {metrics.isVirtual ? 'Virtual' : 'Standard'}
                      </span>
                    </div>
                  </div>

                  {/* Virtual scrolling badge */}
                  {metrics.isVirtual && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 rounded-full px-2 py-1 text-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Performance Mode</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};