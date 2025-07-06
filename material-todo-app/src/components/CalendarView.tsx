import { useState } from 'react';
import { Calendar } from './Calendar';
import { TaskDialog } from './TaskDialog';
import { Task } from '../../shared/types';
import { usePWATodoStore } from '../store/todoStorePWA';

interface CalendarViewProps {
  className?: string;
}

export function CalendarView({ className }: CalendarViewProps) {
  const { updateTask } = usePWATodoStore();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // Handle task rescheduling via drag and drop (future enhancement)
  const handleTaskReschedule = async (taskId: string, newDate: Date) => {
    try {
      await updateTask(taskId, { dueDate: newDate });
    } catch (error) {
      console.error('Failed to reschedule task:', error);
    }
  };

  return (
    <div className={className}>
      <Calendar
        onTaskClick={handleTaskClick}
        onDateClick={handleDateClick}
        onCreateTask={handleCreateTask}
      />
      
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={handleTaskDialogClose}
        taskId={selectedTaskId}
        defaultDueDate={selectedDate || undefined}
      />
    </div>
  );
}