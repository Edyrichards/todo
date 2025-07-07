import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  MoreHorizontal, 
  Settings, 
  BarChart3,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Task } from '../../shared/types';
import { useTodoStore } from '../store/todoStore';
import { KanbanUtils, KanbanColumnId, KanbanColumn as KanbanColumnType } from '../lib/kanbanUtils';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KanbanBoardProps {
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (columnId?: KanbanColumnId) => void;
}

export function KanbanBoard({ onTaskClick, onCreateTask }: KanbanBoardProps) {
  const { tasks, filters, updateTask } = useTodoStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tasks based on current filters and settings
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
    // Apply existing filters
    if (filters.status && filters.status.length > 0) {
      result = result.filter(task => filters.status!.includes(task.status));
    }
    
    if (filters.priority && filters.priority.length > 0) {
      result = result.filter(task => filters.priority!.includes(task.priority));
    }
    
    if (filters.categoryId) {
      result = result.filter(task => task.categoryId === filters.categoryId);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(task =>
        filters.tags!.some(tag => task.tags.includes(tag))
      );
    }

    // Filter completed tasks if hidden
    if (!showCompletedTasks) {
      result = result.filter(task => task.status !== 'completed');
    }
    
    return result;
  }, [tasks, filters, showCompletedTasks]);

  // Group tasks by columns
  const columnTasks = useMemo(() => {
    const groups: Record<KanbanColumnId, Task[]> = {
      'todo': [],
      'in-progress': [],
      'review': [],
      'done': []
    };

    filteredTasks.forEach(task => {
      const columnId = KanbanUtils.getColumnForTask(task);
      groups[columnId].push(task);
    });

    return groups;
  }, [filteredTasks]);

  // Calculate board statistics
  const boardStats = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
    const highPriorityTasks = filteredTasks.filter(task => task.priority === 'high').length;
    const overdueTasks = filteredTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length;

    return {
      total: totalTasks,
      completed: completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      highPriority: highPriorityTasks,
      overdue: overdueTasks
    };
  }, [filteredTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = filteredTasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !activeTask) return;

    const sourceColumnId = KanbanUtils.getColumnForTask(activeTask);
    const targetColumnId = over.data?.current?.columnId as KanbanColumnId;

    if (!targetColumnId || sourceColumnId === targetColumnId) return;

    try {
      const updates = KanbanUtils.updateTaskForColumn(activeTask, targetColumnId);
      await updateTask(activeTask.id, updates);
      
      const targetColumn = KanbanUtils.getColumnById(targetColumnId);
      toast.success(`Task moved to ${targetColumn?.title}`);
    } catch (error) {
      console.error('Failed to move task:', error);
      toast.error('Failed to move task');
    }
  };

  const handleTaskEdit = (task: Task) => {
    onTaskClick?.(task);
  };

  const handleTaskDelete = async (task: Task) => {
    // This will be handled by the KanbanCard component
  };

  const handleCreateTaskInColumn = (columnId: KanbanColumnId) => {
    onCreateTask?.(columnId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Board Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Kanban Board</h2>
          
          {/* Board Stats */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {boardStats.total} tasks
            </Badge>
            <Badge variant="outline">
              {boardStats.completionRate}% complete
            </Badge>
            {boardStats.highPriority > 0 && (
              <Badge variant="destructive">
                {boardStats.highPriority} high priority
              </Badge>
            )}
            {boardStats.overdue > 0 && (
              <Badge variant="outline" className="text-orange-600">
                {boardStats.overdue} overdue
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Board Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                View Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              >
                {showCompletedTasks ? 'Hide' : 'Show'} Completed Tasks
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <BarChart3 size={16} className="mr-2" />
                Board Analytics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings size={16} className="mr-2" />
                Customize Columns
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={() => onCreateTask?.()}
            size="sm"
          >
            <Plus size={16} className="mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[800px] pb-4">
              {KanbanUtils.DEFAULT_COLUMNS.map((column) => (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * KanbanUtils.DEFAULT_COLUMNS.indexOf(column) }}
                  className="min-h-[600px]"
                >
                  <KanbanColumn
                    column={column}
                    tasks={columnTasks[column.id]}
                    onTaskClick={onTaskClick}
                    onCreateTask={() => handleCreateTaskInColumn(column.id)}
                    onEditTask={handleTaskEdit}
                    onDeleteTask={handleTaskDelete}
                  />
                </motion.div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask && (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1.05, rotate: 5 }}
                className="opacity-90"
              >
                <KanbanCard task={activeTask} isDragging />
              </motion.div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}