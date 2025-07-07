import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion } from 'framer-motion';
import { Task } from '../../shared/types';
import { useTodoStore } from '../store/todoStore';
import { SwipeableTaskCard } from './SwipeableTaskCard';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { LoadingSpinner } from './ui/loading';

interface VirtualTaskListProps {
  tasks: Task[];
  height?: number;
  itemHeight?: number;
  overscan?: number;
  className?: string;
}

interface TaskItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    tasks: Task[];
    onToggle: (id: string) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    selectedTaskId: string | null;
  };
}

const TaskItem = React.memo<TaskItemProps>(({ index, style, data }) => {
  const { tasks, onToggle, onEdit, onDelete, selectedTaskId } = data;
  const task = tasks[index];

  if (!task) {
    return (
      <div style={style} className="flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  const isSelected = selectedTaskId === task.id;

  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className={`px-4 ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <SwipeableTaskCard
        task={task}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        className="mb-2"
      />
    </motion.div>
  );
});

TaskItem.displayName = 'TaskItem';

export const VirtualTaskList: React.FC<VirtualTaskListProps> = ({
  tasks,
  height = 400,
  itemHeight = 80,
  overscan = 5,
  className = ''
}) => {
  const { toggleTask, deleteTask } = useTodoStore();
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  // Calculate dynamic height based on content
  const containerHeight = useMemo(() => {
    const minHeight = Math.min(height, tasks.length * itemHeight);
    return Math.max(200, minHeight); // Minimum 200px
  }, [height, tasks.length, itemHeight]);

  // Keyboard navigation
  const { selectedIndex, selectedItemId } = useKeyboardNavigation({
    items: tasks,
    onSelect: (task) => setEditingTask(task),
    onToggle: (task) => toggleTask(task.id),
    onDelete: (task) => deleteTask(task.id),
  });

  // Memoized handlers to prevent unnecessary re-renders
  const handleToggle = useCallback((id: string) => {
    toggleTask(id);
  }, [toggleTask]);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteTask(id);
  }, [deleteTask]);

  // Item data for react-window
  const itemData = useMemo(() => ({
    tasks,
    onToggle: handleToggle,
    onEdit: handleEdit,
    onDelete: handleDelete,
    selectedTaskId: selectedItemId
  }), [tasks, handleToggle, handleEdit, handleDelete, selectedItemId]);

  // Performance monitoring
  const renderStartTime = useMemo(() => performance.now(), [tasks.length]);

  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    if (renderTime > 100) {
      console.warn(`VirtualTaskList render took ${renderTime.toFixed(2)}ms for ${tasks.length} tasks`);
    }
  }, [renderStartTime, tasks.length]);

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
        style={{ height: containerHeight }}
      >
        <div className="text-6xl mb-4 opacity-50">📝</div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No tasks yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first task to get started with your productivity journey.
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`virtual-task-list ${className}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <List
          height={containerHeight}
          itemCount={tasks.length}
          itemSize={itemHeight}
          itemData={itemData}
          overscanCount={overscan}
          className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        >
          {TaskItem}
        </List>
        
        {/* Performance indicator for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 right-2 text-xs bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
            {tasks.length} items virtualized
          </div>
        )}
      </motion.div>

      {/* Task editing dialog would be rendered here */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Task editing functionality would be integrated here with the existing TaskDialog component.
            </p>
            <button
              onClick={() => setEditingTask(null)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// HOC for enhanced virtual list with error boundary
export const EnhancedVirtualTaskList = React.forwardRef<
  HTMLDivElement,
  VirtualTaskListProps
>((props, ref) => {
  return (
    <div ref={ref} className="enhanced-virtual-task-list">
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-muted-foreground">Loading tasks...</span>
          </div>
        }
      >
        <VirtualTaskList {...props} />
      </React.Suspense>
    </div>
  );
});

EnhancedVirtualTaskList.displayName = 'EnhancedVirtualTaskList';