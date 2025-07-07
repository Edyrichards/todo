import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useSpring, animated, config } from 'react-spring';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Star,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Task, TaskPriority } from '../../shared/types';
import { useTodoStore } from '../store/todoStore';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { highlightSearchTerm } from '../lib/textUtils';
import { triggerHaptic, isMobileDevice } from '../lib/gestureUtils';

interface SwipeableTaskCardProps {
  task: Task;
  index: number;
  isSelected: boolean;
  searchTerm?: string;
  onEditTask: (taskId: string) => void;
  className?: string;
}

const priorityColors = {
  high: 'text-red-500 bg-red-500/10',
  medium: 'text-yellow-500 bg-yellow-500/10',
  low: 'text-green-500 bg-green-500/10'
};

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

// Swipe action configurations
const SWIPE_THRESHOLD = 100;
const MAX_SWIPE = 200;

export function SwipeableTaskCard({ 
  task, 
  index, 
  isSelected, 
  searchTerm, 
  onEditTask,
  className 
}: SwipeableTaskCardProps) {
  const { toggleTask, deleteTask, categories } = useTodoStore();
  const [isRevealed, setIsRevealed] = useState(false);
  const [swipeAction, setSwipeAction] = useState<'complete' | 'delete' | null>(null);

  // Spring animation for the card
  const [{ x, opacity, scale }, api] = useSpring(() => ({ 
    x: 0, 
    opacity: 1, 
    scale: 1 
  }));

  // Gesture handling
  const bind = useGesture({
    onDrag: ({ down, movement: [mx], velocity: [vx], cancel, canceled }) => {
      if (canceled || !isMobileDevice()) return;

      const isCompleted = task.status === 'completed';
      
      if (down) {
        // Determine swipe action based on direction
        if (mx > SWIPE_THRESHOLD) {
          setSwipeAction('complete');
          triggerHaptic('light');
        } else if (mx < -SWIPE_THRESHOLD) {
          setSwipeAction('delete');
          triggerHaptic('light');
        } else {
          setSwipeAction(null);
        }

        // Limit swipe distance
        const clampedX = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, mx));
        api.start({ 
          x: clampedX, 
          immediate: true,
          scale: 1 - Math.abs(clampedX) / (MAX_SWIPE * 4) // Slight scale down while swiping
        });
        
        setIsRevealed(Math.abs(clampedX) > SWIPE_THRESHOLD);
      } else {
        // Handle swipe completion
        if (Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5) {
          if (mx > SWIPE_THRESHOLD && !isCompleted) {
            // Swipe right to complete
            handleComplete();
          } else if (mx < -SWIPE_THRESHOLD) {
            // Swipe left to delete
            handleDelete();
          } else {
            // Spring back
            resetPosition();
          }
        } else {
          // Spring back
          resetPosition();
        }
      }
    },
    onTap: ({ event }) => {
      // Prevent tap when card is revealed
      if (isRevealed) {
        event.stopPropagation();
        resetPosition();
        return;
      }
      
      // Handle normal tap
      onEditTask(task.id);
    }
  }, {
    drag: {
      axis: 'x',
      filterTaps: true,
      threshold: 10,
    },
  });

  const handleComplete = async () => {
    triggerHaptic('medium');
    
    // Animate completion
    await api.start({ 
      x: window.innerWidth, 
      opacity: 0,
      config: config.wobbly 
    });
    
    toggleTask(task.id);
    resetPosition();
  };

  const handleDelete = async () => {
    triggerHaptic('heavy');
    
    // Animate deletion
    await api.start({ 
      x: -window.innerWidth, 
      opacity: 0, 
      scale: 0.8,
      config: config.stiff 
    });
    
    deleteTask(task.id);
  };

  const resetPosition = () => {
    setIsRevealed(false);
    setSwipeAction(null);
    api.start({ 
      x: 0, 
      opacity: 1, 
      scale: 1,
      config: config.wobbly 
    });
  };

  const getCategoryInfo = (categoryId?: string) => {
    if (!categoryId) return null;
    return categories.find(cat => cat.id === categoryId);
  };

  const formatDueDate = (dueDate: Date) => {
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    if (isPast(dueDate)) return `Overdue • ${format(dueDate, 'MMM d')}`;
    return format(dueDate, 'MMM d, yyyy');
  };

  const getDueDateColor = (dueDate: Date) => {
    if (isPast(dueDate)) return 'text-red-500';
    if (isToday(dueDate)) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  const category = getCategoryInfo(task.categoryId);
  const isCompleted = task.status === 'completed';

  return (
    <div className={cn('relative touch-pan-y', className)}>
      {/* Background Actions */}
      <AnimatePresence>
        {isRevealed && (
          <>
            {/* Complete Action (Right Swipe) */}
            {swipeAction === 'complete' && !isCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-y-0 left-0 flex items-center justify-start pl-6 bg-green-500 rounded-l-lg"
                style={{ width: `${Math.abs(x.get())}px` }}
              >
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 size={20} />
                  <span className="font-medium">Complete</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            )}

            {/* Delete Action (Left Swipe) */}
            {swipeAction === 'delete' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 bg-red-500 rounded-r-lg"
                style={{ width: `${Math.abs(x.get())}px` }}
              >
                <div className="flex items-center gap-2 text-white">
                  <ArrowLeft size={16} />
                  <span className="font-medium">Delete</span>
                  <Trash2 size={20} />
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Main Card */}
      <animated.div
        {...bind()}
        style={{
          x,
          opacity,
          scale,
          touchAction: 'none',
        }}
        className="relative z-10"
      >
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            delay: index * 0.05,
            duration: 0.3,
            layout: { duration: 0.2 }
          }}
          className={cn(
            'group cursor-pointer select-none',
            isSelected && 'ring-2 ring-primary ring-offset-2'
          )}
        >
          <Card className={cn(
            'transition-all duration-200 hover:shadow-md border-border/50 bg-background',
            isCompleted && 'opacity-60 bg-muted/30',
            task.priority === 'high' && !isCompleted && 'border-l-4 border-l-red-500',
            task.priority === 'medium' && !isCompleted && 'border-l-4 border-l-yellow-500',
            isSelected && 'border-primary'
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="mt-1"
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </motion.div>

                {/* Task Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title and Priority */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                      'font-medium leading-tight',
                      isCompleted && 'line-through text-muted-foreground'
                    )}>
                      {searchTerm ? highlightSearchTerm(task.title, searchTerm) : task.title}
                    </h3>
                    
                    {/* Priority Badge */}
                    {task.priority !== 'low' && (
                      <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                        <Star size={10} className="mr-1" />
                        {priorityLabels[task.priority]}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className={cn(
                      'text-sm text-muted-foreground',
                      isCompleted && 'line-through'
                    )}>
                      {searchTerm ? highlightSearchTerm(task.description, searchTerm) : task.description}
                    </p>
                  )}

                  {/* Meta Information */}
                  <div className="flex items-center gap-4 text-xs">
                    {/* Category */}
                    {category && (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-muted-foreground">{category.name}</span>
                      </div>
                    )}

                    {/* Due Date */}
                    {task.dueDate && (
                      <div className={cn(
                        'flex items-center gap-1',
                        getDueDateColor(new Date(task.dueDate))
                      )}>
                        <Calendar size={12} />
                        <span>{formatDueDate(new Date(task.dueDate))}</span>
                      </div>
                    )}

                    {/* Estimated Time */}
                    {task.estimatedTime && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={12} />
                        <span>{task.estimatedTime}m</span>
                      </div>
                    )}

                    {/* Subtasks Progress */}
                    {task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CheckCircle2 size={12} />
                        <span>
                          {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{searchTerm ? highlightSearchTerm(tag, searchTerm) : tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Actions */}
                {!isMobileDevice() && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task.id);
                      }}
                    >
                      <Edit3 size={14} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </animated.div>

      {/* Mobile Gesture Hint */}
      {isMobileDevice() && !isRevealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground text-center"
        >
          <span className="bg-background/80 px-2 py-1 rounded">
            Swipe → complete • ← delete
          </span>
        </motion.div>
      )}
    </div>
  );
}