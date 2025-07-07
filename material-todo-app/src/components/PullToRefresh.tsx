import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { animated } from 'react-spring';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { usePullToRefresh, isMobileDevice } from '../lib/gestureUtils';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  threshold?: number;
  maxPull?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  enabled = true,
  threshold = 80,
  maxPull = 120,
  className,
}: PullToRefreshProps) {
  const { bind, style, isRefreshing } = usePullToRefresh({
    onRefresh,
    threshold,
    maxPull,
    enabled: enabled && isMobileDevice(),
  });

  // Calculate progress for visual feedback
  const progress = Math.min(style.y.get() / threshold, 1);
  const isThresholdReached = style.y.get() >= threshold;

  if (!isMobileDevice() || !enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-hidden', className)} {...bind()}>
      {/* Pull-to-refresh indicator */}
      <animated.div
        style={{
          height: style.y.to((y) => `${Math.max(0, y)}px`),
          opacity: style.y.to((y) => Math.min(y / 40, 1)),
        }}
        className="absolute top-0 left-0 right-0 z-50 flex items-end justify-center bg-gradient-to-b from-primary/10 to-transparent"
      >
        <motion.div
          className={cn(
            'flex flex-col items-center gap-2 pb-4 transition-colors duration-200',
            isThresholdReached ? 'text-primary' : 'text-muted-foreground'
          )}
          animate={{
            scale: isThresholdReached ? 1.1 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          {/* Icon */}
          <animated.div
            style={{
              rotateZ: style.rotateZ,
            }}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200',
              isRefreshing 
                ? 'border-primary bg-primary text-primary-foreground'
                : isThresholdReached
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground bg-background'
            )}
          >
            {isRefreshing ? (
              <RefreshCw 
                size={16} 
                className="animate-spin" 
              />
            ) : isThresholdReached ? (
              <RefreshCw size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
          </animated.div>

          {/* Progress indicator */}
          <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-current rounded-full"
              animate={{
                width: `${progress * 100}%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
          </div>

          {/* Text */}
          <motion.span
            className="text-xs font-medium"
            animate={{
              opacity: progress > 0.3 ? 1 : 0,
            }}
          >
            {isRefreshing 
              ? 'Refreshing...'
              : isThresholdReached
              ? 'Release to refresh'
              : 'Pull to refresh'
            }
          </motion.span>
        </motion.div>
      </animated.div>

      {/* Content */}
      <animated.div
        style={{
          transform: style.y.to((y) => `translateY(${y}px)`),
        }}
        className="relative z-10"
      >
        {children}
      </animated.div>

      {/* Refresh overlay */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-start justify-center pt-20 bg-background/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-full shadow-lg">
            <RefreshCw size={16} className="animate-spin text-primary" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}