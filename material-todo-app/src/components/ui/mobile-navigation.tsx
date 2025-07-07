import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { useHapticFeedback, useQuickHaptics, HapticPattern } from '../../lib/hapticFeedback';
import { 
  List, Calendar, LayoutGrid, BarChart3, RotateCcw, 
  Plus, Settings, Search, Filter, Menu, X,
  Zap, Eye, Shield, Sparkles
} from 'lucide-react';

type View = 'tasks' | 'calendar' | 'kanban' | 'analytics' | 'recurring';

interface MobileNavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onCreateTask: () => void;
  taskCount: number;
  performanceMetrics?: {
    isVirtual: boolean;
    renderTime: number;
  };
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onViewChange,
  onCreateTask,
  taskCount,
  performanceMetrics
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const { triggerHaptic } = useHapticFeedback();
  const quickHaptics = useQuickHaptics();

  // Touch interaction tracking
  const touchStartTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const navigationItems = [
    { 
      id: 'tasks', 
      icon: List, 
      label: 'Tasks', 
      color: 'from-blue-500 to-blue-600',
      badge: taskCount > 0 ? taskCount : undefined 
    },
    { 
      id: 'calendar', 
      icon: Calendar, 
      label: 'Calendar', 
      color: 'from-emerald-500 to-emerald-600' 
    },
    { 
      id: 'kanban', 
      icon: LayoutGrid, 
      label: 'Board', 
      color: 'from-purple-500 to-purple-600' 
    },
    { 
      id: 'analytics', 
      icon: BarChart3, 
      label: 'Analytics', 
      color: 'from-amber-500 to-amber-600' 
    },
    { 
      id: 'recurring', 
      icon: RotateCcw, 
      label: 'Recurring', 
      color: 'from-pink-500 to-pink-600' 
    }
  ];

  const handleNavItemPress = (view: View) => {
    quickHaptics.onSelection();
    onViewChange(view);
  };

  const handleCreateTaskPress = () => {
    quickHaptics.onPress();
    onCreateTask();
  };

  // Long press for expanded view
  const handleTouchStart = (itemId: string) => {
    touchStartTime.current = Date.now();
    setPressedButton(itemId);
    quickHaptics.onTap();

    longPressTimer.current = setTimeout(() => {
      if (itemId === 'fab') {
        setIsExpanded(true);
        triggerHaptic(HapticPattern.MEDIUM);
      }
    }, 500);
  };

  const handleTouchEnd = (itemId: string, action?: () => void) => {
    const pressDuration = Date.now() - touchStartTime.current;
    setPressedButton(null);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Execute action if it's a quick tap
    if (pressDuration < 500 && action) {
      action();
    }
  };

  return (
    <>
      {/* Main navigation bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Performance indicator bar */}
        {performanceMetrics?.isVirtual && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        )}

        <div className="flex items-center justify-around px-4 py-2 safe-area-inset-bottom">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isPressed = pressedButton === item.id;

            return (
              <motion.button
                key={item.id}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-xl
                  min-h-[56px] min-w-[56px] touch-manipulation
                  ${isActive ? 'bg-primary/10' : 'hover:bg-accent'}
                `}
                onTouchStart={() => handleTouchStart(item.id)}
                onTouchEnd={() => handleTouchEnd(item.id, () => handleNavItemPress(item.id as View))}
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: isPressed ? 0.95 : 1,
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
                transition={{ duration: 0.15 }}
              >
                {/* Icon with gradient background for active state */}
                <motion.div
                  className={`
                    relative p-2 rounded-lg
                    ${isActive ? `bg-gradient-to-r ${item.color}` : ''}
                  `}
                  animate={{
                    rotate: isActive ? [0, 5, -5, 0] : 0,
                    scale: isActive ? [1, 1.1, 1] : 1
                  }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Icon 
                    className={`h-5 w-5 ${
                      isActive ? 'text-white' : 'text-muted-foreground'
                    }`} 
                  />

                  {/* Badge for task count */}
                  {item.badge && (
                    <motion.div
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.5 }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.div>
                  )}

                  {/* Performance indicator */}
                  {item.id === 'tasks' && performanceMetrics?.isVirtual && (
                    <motion.div
                      className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      title="Performance mode active"
                    />
                  )}
                </motion.div>

                {/* Label */}
                <motion.span
                  className={`text-xs font-medium mt-1 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  animate={{ opacity: isActive ? 1 : 0.7 }}
                >
                  {item.label}
                </motion.span>

                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ scaleX: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Floating Action Button */}
      <motion.button
        className={`
          fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full
          bg-gradient-to-r from-blue-500 to-purple-600 text-white
          shadow-lg touch-manipulation flex items-center justify-center
          ${pressedButton === 'fab' ? 'shadow-xl' : ''}
        `}
        onTouchStart={() => handleTouchStart('fab')}
        onTouchEnd={() => handleTouchEnd('fab', handleCreateTaskPress)}
        whileTap={{ scale: 0.9 }}
        animate={{
          scale: pressedButton === 'fab' ? 0.95 : 1,
          boxShadow: [
            '0 4px 15px rgba(59, 130, 246, 0.3)',
            '0 8px 25px rgba(59, 130, 246, 0.5)',
            '0 4px 15px rgba(59, 130, 246, 0.3)'
          ]
        }}
        transition={{ 
          scale: { duration: 0.15 },
          boxShadow: { duration: 2, repeat: Infinity }
        }}
      >
        <motion.div
          animate={{ 
            rotate: isExpanded ? 45 : 0,
            scale: pressedButton === 'fab' ? 0.9 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-6 w-6" />
        </motion.div>

        {/* Performance ring */}
        {performanceMetrics?.isVirtual && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400/50"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Expanded FAB menu */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onTouchStart={() => {
              setIsExpanded(false);
              quickHaptics.onTap();
            }}
          >
            <motion.div
              className="absolute bottom-24 right-4 space-y-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {[
                { icon: Plus, label: 'Quick Task', action: () => {
                  onCreateTask();
                  setIsExpanded(false);
                }},
                { icon: Search, label: 'Search', action: () => {
                  // Handle search
                  setIsExpanded(false);
                }},
                { icon: Filter, label: 'Filter', action: () => {
                  // Handle filter
                  setIsExpanded(false);
                }},
                { icon: Settings, label: 'Settings', action: () => {
                  // Handle settings
                  setIsExpanded(false);
                }}
              ].map((item, index) => (
                <motion.button
                  key={item.label}
                  className="flex items-center gap-3 bg-background/95 backdrop-blur-lg border border-border rounded-full px-4 py-3 shadow-lg touch-manipulation"
                  onTouchStart={() => quickHaptics.onTap()}
                  onTouchEnd={item.action}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Close button */}
            <motion.button
              className="absolute bottom-20 right-4 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg touch-manipulation flex items-center justify-center"
              onTouchStart={() => quickHaptics.onTap()}
              onTouchEnd={() => setIsExpanded(false)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-6 w-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Mobile performance status bar
interface MobilePerformanceBarProps {
  isVisible: boolean;
  metrics: {
    renderTime: number;
    taskCount: number;
    isVirtual: boolean;
    memoryUsage: number;
  };
}

export const MobilePerformanceBar: React.FC<MobilePerformanceBarProps> = ({
  isVisible,
  metrics
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  const performanceScore = Math.max(0, Math.min(100, 100 - (metrics.renderTime * 2)));

  const getPerformanceColor = () => {
    if (performanceScore > 80) return 'from-emerald-500 to-emerald-600';
    if (performanceScore > 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const handleToggle = () => {
    triggerHaptic(HapticPattern.SELECTION);
    setIsExpanded(!isExpanded);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border safe-area-inset-top"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.button
            className="w-full p-3 touch-manipulation"
            onTouchStart={() => triggerHaptic(HapticPattern.LIGHT)}
            onTouchEnd={handleToggle}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-3 h-3 rounded-full bg-gradient-to-r ${getPerformanceColor()}`}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-medium">
                  {metrics.isVirtual ? 'Performance Mode' : 'Standard Mode'}
                </span>
                {metrics.isVirtual && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-4 w-4 text-blue-500" />
                  </motion.div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {metrics.taskCount} tasks
                </span>
                <span className={`text-xs font-bold ${
                  performanceScore > 80 ? 'text-emerald-500' : 
                  performanceScore > 60 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {Math.round(performanceScore)}%
                </span>
              </div>
            </div>
          </motion.button>

          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-500">
                        {metrics.renderTime.toFixed(1)}ms
                      </div>
                      <div className="text-xs text-muted-foreground">Render Time</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-500">
                        {metrics.memoryUsage.toFixed(1)}MB
                      </div>
                      <div className="text-xs text-muted-foreground">Memory</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-500">
                        {performanceScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    {metrics.isVirtual && (
                      <div className="flex items-center gap-1 bg-blue-500/10 text-blue-600 rounded-full px-3 py-1 text-xs">
                        <Eye className="h-3 w-3" />
                        <span>Virtual Scrolling</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 rounded-full px-3 py-1 text-xs">
                      <Shield className="h-3 w-3" />
                      <span>Error Protected</span>
                    </div>
                    <div className="flex items-center gap-1 bg-purple-500/10 text-purple-600 rounded-full px-3 py-1 text-xs">
                      <Sparkles className="h-3 w-3" />
                      <span>Enhanced</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};