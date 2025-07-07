import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
  className?: string;
  dotClassName?: string;
  activeDotClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PageIndicator({ 
  currentPage, 
  totalPages, 
  className,
  dotClassName,
  activeDotClassName,
  size = 'md'
}: PageIndicatorProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  };

  return (
    <div className={cn('flex items-center justify-center', gapClasses[size], className)}>
      {Array.from({ length: totalPages }, (_, index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full transition-colors duration-200',
            sizeClasses[size],
            currentPage === index 
              ? cn('bg-primary', activeDotClassName)
              : cn('bg-muted-foreground/30', dotClassName)
          )}
          initial={false}
          animate={{
            scale: currentPage === index ? 1.2 : 1,
            opacity: currentPage === index ? 1 : 0.6,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />
      ))}
    </div>
  );
}

interface ViewIndicatorProps {
  currentView: 'tasks' | 'calendar' | 'kanban' | 'recurring' | 'analytics';
  className?: string;
}

export function ViewIndicator({ currentView, className }: ViewIndicatorProps) {
  const views = ['tasks', 'calendar', 'kanban', 'recurring', 'analytics'];
  const currentIndex = views.indexOf(currentView);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40',
        'bg-background/80 backdrop-blur-sm border border-border rounded-full px-4 py-2',
        'hidden md:flex',
        className
      )}
    >
      <PageIndicator 
        currentPage={currentIndex}
        totalPages={views.length}
        size="sm"
        className="gap-2"
      />
    </motion.div>
  );
}