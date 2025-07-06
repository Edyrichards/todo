import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animated } from 'react-spring';
import { 
  CheckCircle2, 
  Calendar, 
  Briefcase, 
  BarChart3, 
  Repeat,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useViewNavigation, isMobileDevice, triggerHaptic } from '../lib/gestureUtils';
import { cn } from '@/lib/utils';

type AppView = 'tasks' | 'calendar' | 'kanban' | 'recurring' | 'analytics';

interface MobileNavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  className?: string;
}

const viewConfig = {
  tasks: {
    icon: CheckCircle2,
    label: 'Tasks',
    color: 'text-blue-500',
  },
  calendar: {
    icon: Calendar,
    label: 'Calendar',
    color: 'text-green-500',
  },
  kanban: {
    icon: Briefcase,
    label: 'Kanban',
    color: 'text-purple-500',
  },
  recurring: {
    icon: Repeat,
    label: 'Recurring',
    color: 'text-orange-500',
  },
  analytics: {
    icon: BarChart3,
    label: 'Analytics',
    color: 'text-pink-500',
  },
};

export function MobileNavigation({ currentView, onViewChange, className }: MobileNavigationProps) {
  const views: AppView[] = ['tasks', 'calendar', 'kanban', 'recurring', 'analytics'];
  const currentIndex = views.indexOf(currentView);

  const { bind, style, animated: AnimatedDiv } = useViewNavigation(
    currentView,
    views,
    onViewChange
  );

  if (!isMobileDevice()) {
    return null;
  }

  const handleViewTap = (view: AppView) => {
    onViewChange(view);
    triggerHaptic('medium');
  };

  const canSwipeLeft = currentIndex > 0;
  const canSwipeRight = currentIndex < views.length - 1;

  return (
    <div className={cn('relative', className)}>
      {/* Swipe gesture area */}
      <AnimatedDiv
        {...bind()}
        style={{
          x: style.x,
          y: style.y,
          touchAction: 'pan-y',
        }}
        className="min-h-0"
      >
        {/* Bottom Navigation Bar */}
        <motion.div
          layout
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-pb"
        >
          {/* Swipe Indicators */}
          <div className="flex justify-between items-center px-4 py-1">
            <motion.div
              animate={{ opacity: canSwipeLeft ? 1 : 0.3 }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <ChevronLeft size={12} />
              <span>Swipe</span>
            </motion.div>

            <div className="flex items-center gap-1">
              {views.map((_, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                  animate={{
                    scale: index === currentIndex ? 1.2 : 1,
                  }}
                />
              ))}
            </div>

            <motion.div
              animate={{ opacity: canSwipeRight ? 1 : 0.3 }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <span>Swipe</span>
              <ChevronRight size={12} />
            </motion.div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center justify-around px-2 pb-2">
            {views.map((view) => {
              const config = viewConfig[view];
              const Icon = config.icon;
              const isActive = view === currentView;

              return (
                <motion.button
                  key={view}
                  onClick={() => handleViewTap(view)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
                    'min-w-[64px] min-h-[56px]', // Minimum touch target
                    isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <motion.div
                    animate={{
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon size={20} />
                  </motion.div>
                  
                  <motion.span
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                    animate={{
                      fontSize: isActive ? '0.75rem' : '0.7rem',
                    }}
                  >
                    {config.label}
                  </motion.span>

                  {/* Active indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 w-1 h-1 bg-primary rounded-full"
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatedDiv>

      {/* View transition hints */}
      <AnimatePresence>
        {style.x.get() !== 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-lg">
              {style.x.get() > 0 && canSwipeRight && (
                <>
                  <ChevronRight size={16} className="text-primary" />
                  <span className="text-sm font-medium">
                    {viewConfig[views[currentIndex + 1]]?.label}
                  </span>
                </>
              )}
              
              {style.x.get() < 0 && canSwipeLeft && (
                <>
                  <span className="text-sm font-medium">
                    {viewConfig[views[currentIndex - 1]]?.label}
                  </span>
                  <ChevronLeft size={16} className="text-primary" />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to add safe area padding for mobile devices
export function useSafeArea() {
  React.useEffect(() => {
    if (isMobileDevice() && 'CSS' in window && 'supports' in window.CSS) {
      // Add safe area CSS custom properties
      const root = document.documentElement;
      
      // Check if device supports safe area
      if (window.CSS.supports('padding-bottom: env(safe-area-inset-bottom)')) {
        root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
      } else {
        root.style.setProperty('--safe-area-bottom', '0px');
        root.style.setProperty('--safe-area-top', '0px');
      }
    }
  }, []);
}