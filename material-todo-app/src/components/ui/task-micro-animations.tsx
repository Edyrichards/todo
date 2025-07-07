import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Star, Clock, Trash2, Edit3, Zap, Sparkles, Target, ArrowRight } from 'lucide-react';

interface TaskInteractionMicroAnimationsProps {
  task: {
    id: string;
    title: string;
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

export const TaskInteractionMicroAnimations: React.FC<TaskInteractionMicroAnimationsProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  onPriorityChange,
  isVirtualized = false,
  index = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  
  // Motion values for smooth interactions
  const x = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useTransform(x, [-150, -50, 0, 50, 150], [0.5, 0.8, 1, 0.8, 0.5]);
  const rotateY = useTransform(x, [-100, 0, 100], [-5, 0, 5]);
  
  // Priority colors
  const priorityColors = {
    low: 'from-green-400 to-green-600',
    medium: 'from-yellow-400 to-orange-500',
    high: 'from-red-400 to-red-600'
  };

  // Show swipe hint for first few tasks
  useEffect(() => {
    if (index < 3 && !task.completed && !isVirtualized) {
      const timer = setTimeout(() => setShowSwipeHint(true), 2000 + index * 1000);
      return () => clearTimeout(timer);
    }
  }, [index, task.completed, isVirtualized]);

  // Completion effect
  const handleToggle = () => {
    if (!task.completed) {
      setShowCompletionEffect(true);
      setTimeout(() => setShowCompletionEffect(false), 2000);
    }
    setInteractionCount(prev => prev + 1);
    onToggle(task.id);
  };

  // Swipe handlers
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    
    if (info.offset.x > swipeThreshold) {
      // Swipe right - complete task
      handleToggle();
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe left - delete task
      onDelete(task.id);
    }
    
    // Reset position
    x.set(0);
  };

  // Priority cycling
  const cyclePriority = () => {
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    onPriorityChange(task.id, nextPriority);
    setInteractionCount(prev => prev + 1);
  };

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        delay: isVirtualized ? 0 : index * 0.05,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Swipe hint animation */}
      <AnimatePresence>
        {showSwipeHint && !task.completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {/* Swipe right hint */}
            <motion.div
              className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1"
              animate={{ 
                x: [0, 20, 0],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 2, repeat: 2 }}
            >
              <ArrowRight className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Swipe to complete</span>
            </motion.div>
            
            {/* Swipe left hint */}
            <motion.div
              className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1"
              animate={{ 
                x: [0, -20, 0],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 2, repeat: 2, delay: 1 }}
            >
              <span className="text-xs text-red-600 font-medium">Swipe to delete</span>
              <Trash2 className="h-3 w-3 text-red-600" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background swipe indicators */}
      <motion.div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{ opacity: useTransform(x, [-100, -25, 0, 25, 100], [1, 0, 0, 0, 1]) }}
      >
        {/* Delete background (left swipe) */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-start pl-6"
          style={{ 
            opacity: useTransform(x, [-100, -25, 0], [1, 0.3, 0]),
            x: useTransform(x, [-100, 0], [-20, 0])
          }}
        >
          <Trash2 className="h-5 w-5 text-white" />
        </motion.div>
        
        {/* Complete background (right swipe) */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-l from-green-500 to-green-600 flex items-center justify-end pr-6"
          style={{ 
            opacity: useTransform(x, [0, 25, 100], [0, 0.3, 1]),
            x: useTransform(x, [0, 100], [0, 20])
          }}
        >
          <Check className="h-5 w-5 text-white" />
        </motion.div>
      </motion.div>

      {/* Main task card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, scale, rotateY }}
        className={`
          relative bg-card border border-border rounded-lg p-4 cursor-pointer
          transition-all duration-200 hover:shadow-lg
          ${task.completed ? 'opacity-60' : ''}
        `}
        whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Performance indicator for virtualized items */}
        {isVirtualized && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
            title="Virtualized for performance"
          />
        )}

        {/* Interaction sparkles */}
        <AnimatePresence>
          {isHovered && interactionCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 left-2"
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3 text-yellow-500" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-start gap-3">
          {/* Checkbox with micro-animation */}
          <motion.button
            onClick={handleToggle}
            className={`
              relative mt-1 w-5 h-5 rounded border-2 flex items-center justify-center
              ${task.completed 
                ? 'bg-green-500 border-green-500' 
                : 'border-muted-foreground hover:border-primary'
              }
            `}
            whileHover={{ scale: 1.1 }}
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
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <motion.h3
              className={`font-medium transition-all duration-300 ${
                task.completed ? 'line-through text-muted-foreground' : ''
              }`}
              animate={task.completed ? { opacity: 0.6 } : { opacity: 1 }}
            >
              {task.title}
            </motion.h3>
            
            {task.dueDate && (
              <motion.div
                className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"
                whileHover={{ scale: 1.05 }}
              >
                <Clock className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </motion.div>
            )}
          </div>

          {/* Priority indicator with click to cycle */}
          <motion.button
            onClick={cyclePriority}
            className={`
              w-3 h-3 rounded-full bg-gradient-to-r ${priorityColors[task.priority]}
              relative overflow-hidden
            `}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            animate={isHovered ? { rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {/* Priority pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          {/* Action buttons on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                className="flex gap-1"
              >
                <motion.button
                  onClick={() => onEdit(task.id)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit3 className="h-3 w-3" />
                </motion.button>
                
                <motion.button
                  onClick={() => onDelete(task.id)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="h-3 w-3" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Completion celebration effect */}
        <AnimatePresence>
          {showCompletionEffect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Celebration particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full"
                  initial={{ 
                    x: '50%', 
                    y: '50%', 
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{
                    x: `${50 + Math.cos((i * Math.PI * 2) / 6) * 30}%`,
                    y: `${50 + Math.sin((i * Math.PI * 2) / 6) * 30}%`,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
              
              {/* Success message */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-green-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Task completed!
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance boost indicator */}
        {isVirtualized && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 right-2 flex items-center gap-1 bg-blue-500/10 text-blue-600 text-xs px-2 py-1 rounded-full"
          >
            <Zap className="h-3 w-3" />
            <span>Virtual</span>
          </motion.div>
        )}
      </motion.div>

      {/* Hint to dismiss swipe hints */}
      <AnimatePresence>
        {showSwipeHint && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowSwipeHint(false)}
            className="absolute top-2 right-2 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs hover:bg-accent z-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ×
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};