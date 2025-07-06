import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Calendar } from './Calendar';
import { TaskDialog } from './TaskDialog';
import { Task } from '../../shared/types';
import { usePWATodoStore } from '../store/todoStorePWA';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarUtils } from '../lib/calendarUtils';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

interface CalendarViewProps {
  className?: string;
}

interface DraggableTaskProps {
  task: Task;
  compact?: boolean;
}

function DraggableTask({ task, compact = false }: DraggableTaskProps) {
  const priorityColor = CalendarUtils.getTaskPriorityColor(task.priority);
  const statusColor = CalendarUtils.getTaskStatusColor(task.status);
  
  return (
    <Card className={`cursor-move transition-all duration-200 ${statusColor} border-l-4`} 
          style={{ borderLeftColor: priorityColor.replace('bg-', '#') }}>
      <CardContent className={compact ? 'p-2' : 'p-3'}>
        <div className="flex items-start gap-2">
          <div className={`w-2 h-2 rounded-full mt-1 ${priorityColor}`} />
          <div className="flex-1 min-w-0">
            <div className={`font-medium truncate ${
              compact ? 'text-xs' : 'text-sm'
            } ${
              task.status === 'completed' ? 'line-through opacity-60' : ''
            }`}>
              {task.title}
            </div>
            {!compact && task.estimatedTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock size={10} />
                <span>{task.estimatedTime}m</span>
              </div>
            )}
            {!compact && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{task.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CalendarViewWithDragDrop({ className }: CalendarViewProps) {
  const { updateTask } = usePWATodoStore();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsTaskDialogOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCreateTask = (date?: Date) => {
    setSelectedDate(date || null);
    setSelectedTaskId(null);
    setIsTaskDialogOpen(true);
  };

  const handleTaskDialogClose = () => {
    setIsTaskDialogOpen(false);
    setSelectedTaskId(null);
    setSelectedDate(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Find the task being dragged
    // We'll pass the task data through the drag context
    const taskData = active.data.current?.task as Task;
    setActiveTask(taskData);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !activeTask) return;

    // Get the target date from the drop zone
    const targetDate = over.data.current?.date as Date;
    
    if (targetDate && activeTask.dueDate) {
      const currentDate = new Date(activeTask.dueDate);
      
      // Check if we're actually moving to a different date
      if (!isSameDay(currentDate, targetDate)) {
        try {
          await updateTask(activeTask.id, { dueDate: targetDate });
          
          const formattedDate = targetDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          });
          
          toast.success(`Task rescheduled to ${formattedDate}`);
        } catch (error) {
          console.error('Failed to reschedule task:', error);
          toast.error('Failed to reschedule task');
        }
      }
    }
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Calendar
          onTaskClick={handleTaskClick}
          onDateClick={handleDateClick}
          onCreateTask={handleCreateTask}
        />
        
        <DragOverlay>
          {activeTask && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.05, rotate: 2 }}
              className="opacity-80"
            >
              <DraggableTask task={activeTask} compact />
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>
      
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={handleTaskDialogClose}
        taskId={selectedTaskId}
        defaultDueDate={selectedDate || undefined}
      />
    </div>
  );
}