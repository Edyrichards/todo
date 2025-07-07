import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Task } from '../../shared/types';
import { usePWATodoStore } from '../store/todoStorePWA';
import { SwipeableTaskCard } from './SwipeableTaskCard';
import { PullToRefresh } from './PullToRefresh';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (taskId: string) => void;
}

export function TaskList({ tasks, onEditTask }: TaskListProps) {
  const { filters, categories, reorderTasks, toggleTask, deleteTask, syncTasks } = usePWATodoStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { selectedIndex, clearSelection } = useKeyboardNavigation({
    itemCount: tasks.length,
    onActivate: (index) => {
      if (tasks[index]) {
        onEditTask(tasks[index].id);
      }
    },
    onToggle: (index) => {
      if (tasks[index]) {
        toggleTask(tasks[index].id);
      }
    },
    onDelete: (index) => {
      if (tasks[index]) {
        deleteTask(tasks[index].id);
      }
    }
  });

  // Pull to refresh handler
  const handleRefresh = async () => {
    await syncTasks();
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over?.id);
      
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      const newTaskIds = newTasks.map(task => task.id);
      
      // Use the new reorderTasks function for better PWA support
      reorderTasks(newTaskIds);
    }
  }

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

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <CheckCircle2 size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground">
            Create a new task or adjust your filters to see your todos here.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="flex-1">
      <div className="p-6 space-y-4">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {tasks.map((task, index) => (
                <SwipeableTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  isSelected={selectedIndex === index}
                  searchTerm={filters.search}
                  onEditTask={onEditTask}
                  className="mb-4"
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
        
        {/* Keyboard Navigation Help */}
        {tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground text-center p-4 border-t border-border/50"
          >
            <p>Use ↑↓ to navigate, Enter to edit, Space to toggle, Delete to remove</p>
          </motion.div>
        )}
      </div>
    </PullToRefresh>
  );
}