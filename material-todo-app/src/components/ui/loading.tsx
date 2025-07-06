import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { shimmer, pulse, rotate, bounceIn } from '../lib/animations';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      variants={rotate}
      animate="animate"
      className={cn(sizeClasses[size], 'text-primary', className)}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
}

interface SkeletonProps {
  className?: string;
  shimmerEffect?: boolean;
}

export function Skeleton({ className, shimmerEffect = true }: SkeletonProps) {
  const baseClass = "bg-muted rounded";
  
  if (shimmerEffect) {
    return (
      <motion.div
        className={cn(
          baseClass,
          "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
          className
        )}
        variants={shimmer}
        animate="animate"
      />
    );
  }

  return (
    <motion.div
      className={cn(baseClass, className)}
      variants={pulse}
      animate="animate"
    />
  );
}

interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({ showAvatar = false, lines = 3, className }: SkeletonCardProps) {
  return (
    <motion.div
      className={cn("p-4 space-y-3", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-3">
        {showAvatar && <Skeleton className="w-10 h-10 rounded-full" />}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-3",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  className?: string;
}

export function SkeletonList({ count = 5, itemHeight = 60, className }: SkeletonListProps) {
  return (
    <motion.div
      className={cn("space-y-2", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          <Skeleton 
            className="w-full"
            style={{ height: itemHeight }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ 
  isLoading, 
  message = "Loading...", 
  className,
  children 
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex flex-col items-center gap-3"
            variants={bounceIn}
            initial="initial"
            animate="animate"
          >
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

interface ProgressDotsProps {
  count?: number;
  activeIndex?: number;
  className?: string;
}

export function ProgressDots({ count = 3, activeIndex = 0, className }: ProgressDotsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full",
            i === activeIndex ? "bg-primary" : "bg-muted"
          )}
          animate={{
            scale: i === activeIndex ? 1.2 : 1,
            opacity: i === activeIndex ? 1 : 0.5,
          }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
}

interface LoadingBarProps {
  progress?: number;
  isIndeterminate?: boolean;
  className?: string;
}

export function LoadingBar({ 
  progress = 0, 
  isIndeterminate = false, 
  className 
}: LoadingBarProps) {
  if (isIndeterminate) {
    return (
      <div className={cn("w-full h-1 bg-muted rounded-full overflow-hidden", className)}>
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: "30%" }}
        />
      </div>
    );
  }

  return (
    <div className={cn("w-full h-1 bg-muted rounded-full overflow-hidden", className)}>
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackIndicatorProps {
  type: FeedbackType;
  message: string;
  isVisible: boolean;
  className?: string;
}

export function FeedbackIndicator({ 
  type, 
  message, 
  isVisible, 
  className 
}: FeedbackIndicatorProps) {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-orange-600 bg-orange-50 border-orange-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  const Icon = icons[type];

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border",
        colors[type],
        className
      )}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        scale: isVisible ? 1 : 0.8,
        y: isVisible ? 0 : 20,
      }}
      transition={{ 
        type: "spring", 
        damping: 20, 
        stiffness: 300 
      }}
    >
      <motion.div
        variants={bounceIn}
        initial="initial"
        animate={isVisible ? "animate" : "initial"}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}

interface PulsingDotProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulsingDot({ 
  color = 'bg-green-500', 
  size = 'md', 
  className 
}: PulsingDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <motion.div
      className={cn(
        "rounded-full relative",
        sizeClasses[size],
        color,
        className
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className={cn("absolute inset-0 rounded-full", color)}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypewriterText({ 
  text, 
  speed = 50, 
  className,
  onComplete 
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-primary"
      >
        |
      </motion.span>
    </span>
  );
}

// Higher-order component for adding loading states
export function withLoadingState<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  LoadingComponent?: React.ComponentType
) {
  return function WithLoadingState(props: T & { isLoading?: boolean }) {
    const { isLoading, ...restProps } = props;

    if (isLoading) {
      return LoadingComponent ? (
        <LoadingComponent />
      ) : (
        <div className="flex items-center justify-center p-4">
          <LoadingSpinner />
        </div>
      );
    }

    return <WrappedComponent {...(restProps as T)} />;
  };
}