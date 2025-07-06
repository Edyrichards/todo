import { useState } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { TaskDialog } from './TaskDialog';
import { Task } from '../../shared/types';
import { usePWATodoStore } from '../store/todoStorePWA';
import { KanbanUtils, KanbanColumnId } from '../lib/kanbanUtils';

interface KanbanViewProps {
  className?: string;
}

export function KanbanView({ className }: KanbanViewProps) {
  const { addTask } = usePWATodoStore();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<KanbanColumnId | null>(null);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setTargetColumnId(null); // Clear column context for editing
    setIsTaskDialogOpen(true);
  };

  const handleCreateTask = (columnId?: KanbanColumnId) => {
    setSelectedTaskId(null);
    setTargetColumnId(columnId || 'todo');
    setIsTaskDialogOpen(true);
  };

  const handleTaskDialogClose = () => {
    setIsTaskDialogOpen(false);
    setSelectedTaskId(null);
    setTargetColumnId(null);
  };

  // When creating a new task, set appropriate defaults based on target column
  const getDefaultTaskValues = () => {
    if (!targetColumnId) return {};

    const column = KanbanUtils.getColumnById(targetColumnId);
    const status = KanbanUtils.getStatusForColumn(targetColumnId);
    
    const defaults: any = {
      status
    };

    // Add review tag for review column
    if (targetColumnId === 'review') {
      defaults.tags = ['review'];
    }

    return defaults;
  };

  return (
    <div className={className}>
      <KanbanBoard
        onTaskClick={handleTaskClick}
        onCreateTask={handleCreateTask}
      />
      
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={handleTaskDialogClose}
        taskId={selectedTaskId}
        defaultValues={getDefaultTaskValues()}
      />
    </div>
  );
}