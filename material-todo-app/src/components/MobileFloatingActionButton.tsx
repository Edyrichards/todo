import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animated, config } from 'react-spring';
import { 
  Plus, 
  Edit3, 
  Calendar, 
  Tag,
  Clock,
  Mic,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLongPress, useTouchFeedback, isMobileDevice, triggerHaptic } from '../lib/gestureUtils';
import { VoiceRecordingButton } from './ui/voice-recording-button';
import { VoiceTaskDialog } from './ui/voice-task-dialog';
import { VoiceTaskResult } from '../services/voice-task-service';
import { Task } from '../../shared/types';
import { cn } from '@/lib/utils';

interface MobileFloatingActionButtonProps {
  onCreateTask: () => void;
  onVoiceTask?: (task: Partial<Task>) => void;
  onQuickActions?: {
    addDueDate?: () => void;
    addReminder?: () => void;
    addCategory?: () => void;
    addFromTemplate?: () => void;
    voiceTask?: () => void;
  };
  className?: string;
}

const quickActions = [
  {
    key: 'voiceTask',
    icon: Mic,
    label: 'Voice Task',
    color: 'bg-red-500 hover:bg-red-600',
  },
  {
    key: 'addDueDate',
    icon: Calendar,
    label: 'Add Due Date',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    key: 'addReminder',
    icon: Clock,
    label: 'Add Reminder',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    key: 'addCategory',
    icon: Tag,
    label: 'Add Category',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    key: 'addFromTemplate',
    icon: Edit3,
    label: 'From Template',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
];

export function MobileFloatingActionButton({ 
  onCreateTask, 
  onVoiceTask,
  onQuickActions,
  className 
}: MobileFloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceTaskResult | null>(null);

  // Long press to expand quick actions
  const { bind: longPressBind, style: longPressStyle } = useLongPress({
    onLongPress: () => {
      if (isMobileDevice()) {
        setIsExpanded(!isExpanded);
        triggerHaptic('medium');
      }
    },
    enabled: isMobileDevice(),
  });

  // Touch feedback for main button
  const { bind: touchBind, style: touchStyle } = useTouchFeedback();

  const handleMainAction = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      onCreateTask();
      triggerHaptic('light');
    }
  };

  const handleQuickAction = (actionKey: string) => {
    if (actionKey === 'voiceTask') {
      // Handle voice task specially
      setIsExpanded(false);
      return;
    }
    
    const action = onQuickActions?.[actionKey as keyof typeof onQuickActions];
    if (action) {
      action();
      setIsExpanded(false);
      triggerHaptic('medium');
    }
  };

  const handleVoiceTaskCreated = (result: VoiceTaskResult) => {
    setVoiceResult(result);
    setShowVoiceDialog(true);
  };

  const handleVoiceTaskConfirm = (task: Partial<Task>) => {
    onVoiceTask?.(task);
    setShowVoiceDialog(false);
    setVoiceResult(null);
  };

  // Don't render on desktop
  if (!isMobileDevice()) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <div className={cn('fixed bottom-20 right-4 z-50', className)}>
        {/* Quick Action Buttons */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 25,
                staggerChildren: 0.1,
              }}
              className="absolute bottom-20 right-0 flex flex-col gap-3"
            >
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                const isAvailable = onQuickActions?.[action.key as keyof typeof onQuickActions];
                
                if (!isAvailable) return null;

                return (
                  <motion.div
                    key={action.key}
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      scale: 1,
                      transition: { delay: index * 0.05 }
                    }}
                    exit={{ 
                      opacity: 0, 
                      x: 20, 
                      scale: 0.8,
                      transition: { delay: (quickActions.length - index) * 0.05 }
                    }}
                    className="flex items-center gap-3"
                  >
                    {/* Label */}
                    <motion.div
                      className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg"
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {action.label}
                      </span>
                    </motion.div>

                    {/* Action Button */}
                    {action.key === 'voiceTask' ? (
                      <VoiceRecordingButton
                        variant="mini"
                        onTaskCreated={handleVoiceTaskCreated}
                        className={cn(
                          'w-12 h-12 shadow-lg transition-all duration-200',
                          action.color
                        )}
                      />
                    ) : (
                      <motion.button
                        onClick={() => handleQuickAction(action.key)}
                        className={cn(
                          'w-12 h-12 rounded-full shadow-lg text-white transition-all duration-200',
                          'flex items-center justify-center',
                          action.color
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Icon size={20} />
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <animated.div
          {...longPressBind()}
          {...touchBind()}
          style={{
            scale: longPressStyle.scale.to(s => s * touchStyle.scale.get()),
          }}
          className="relative"
        >
          <motion.button
            onClick={handleMainAction}
            className={cn(
              'w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground',
              'rounded-full shadow-lg transition-all duration-200',
              'flex items-center justify-center',
              'min-h-[44px] min-w-[44px]', // Minimum touch target
              isDragging && 'shadow-2xl'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              rotate: isExpanded ? 45 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
          >
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ opacity: 0, rotate: 45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -45 }}
                  transition={{ duration: 0.15 }}
                >
                  <Plus size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Long press hint */}
          {!isExpanded && onQuickActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2 }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            >
              <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-2 py-1 shadow-lg">
                <span className="text-xs text-muted-foreground">
                  Long press for more options
                </span>
              </div>
            </motion.div>
          )}

          {/* Ripple effect */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.3, scale: 2 }}
                exit={{ opacity: 0, scale: 3 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-primary rounded-full -z-10"
              />
            )}
          </AnimatePresence>
        </animated.div>

        {/* Quick action counter */}
        {isExpanded && onQuickActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-3 -left-3 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center"
          >
            <span className="text-xs font-medium">
              {quickActions.filter(action => 
                onQuickActions[action.key as keyof typeof onQuickActions]
              ).length}
            </span>
          </motion.div>
        )}
      </div>

      {/* Voice Task Dialog */}
      {voiceResult && (
        <VoiceTaskDialog
          isOpen={showVoiceDialog}
          onClose={() => setShowVoiceDialog(false)}
          voiceResult={voiceResult}
          onConfirm={handleVoiceTaskConfirm}
          onEdit={() => {/* Handle edit if needed */}}
        />
      )}
    </>
  );
}