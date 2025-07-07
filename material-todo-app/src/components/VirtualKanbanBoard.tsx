import React, { useMemo, useRef, useState } from 'react';
import { Task } from '../../shared/types';
import { VirtualScroll } from './ui/virtual-scroll';
import { ErrorBoundary } from './ui/error-boundary';
import { KanbanCard } from './KanbanCard';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Plus, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface VirtualKanbanColumnProps {
  title: string;
  status: string;
  tasks: Task[];
  onEditTask: (taskId: string) => void;
  onAddTask: () => void;
  containerHeight?: number;
  enableVirtualization?: boolean;
}

function VirtualKanbanColumn({
  title,
  status,
  tasks,
  onEditTask,
  onAddTask,
  containerHeight = 600,
  enableVirtualization = true,
}: VirtualKanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  // Calculate item height based on task content
  const getItemHeight = (task: Task, index: number) => {
    let height = 120; // Base card height
    
    // Add height for description
    if (task.description && task.description.length > 100) {
      height += 40;
    }
    
    // Add height for subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      height += Math.min(task.subtasks.length * 24, 72);
    }
    
    // Add height for tags
    if (task.tags && task.tags.length > 0) {
      height += 32;
    }
    
    return height;
  };

  // Render function for virtual scroll
  const renderTaskCard = (task: Task, index: number) => (
    <div key={task.id} className="p-2">
      <KanbanCard
        task={task}
        onEdit={() => onEditTask(task.id)}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg border">
      {/* Column Header */}
      <div className="p-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={onAddTask}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div 
        ref={setNodeRef}
        className="flex-1 p-2 overflow-hidden"
      >
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {enableVirtualization && tasks.length > 10 ? (
            <VirtualScroll
              items={tasks.map(task => ({ ...task, id: task.id }))}
              itemHeight={120}
              containerHeight={containerHeight - 100} // Account for header
              overscan={3}
              renderItem={renderTaskCard}
              getItemHeight={getItemHeight}
              className="virtual-kanban-column"
            />
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderTaskCard(task, index)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

interface VirtualKanbanBoardProps {
  tasks: Task[];
  onEditTask: (taskId: string) => void;
  onAddTask: (status?: string) => void;
  containerHeight?: number;
  enableVirtualization?: boolean;
}

export function VirtualKanbanBoard({
  tasks,
  onEditTask,
  onAddTask,
  containerHeight = 700,
  enableVirtualization = true,
}: VirtualKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag and drop sensors
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

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const groups = {
      todo: [] as Task[],
      'in-progress': [] as Task[],
      review: [] as Task[],
      done: [] as Task[],
    };

    tasks.forEach(task => {
      const status = task.status || 'todo';
      if (status in groups) {
        groups[status as keyof typeof groups].push(task);
      } else {
        groups.todo.push(task);
      }
    });

    return groups;
  }, [tasks]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) {
      setActiveId(null);
      return;
    }

    // Update task status if dropped on different column
    const newStatus = over.id as string;
    if (activeTask.status !== newStatus) {
      // This would typically update the task in your store
      console.log(`Moving task ${activeTask.id} to ${newStatus}`);
    }

    setActiveId(null);
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const columns = [
    { id: 'todo', title: 'To Do', tasks: tasksByStatus.todo },
    { id: 'in-progress', title: 'In Progress', tasks: tasksByStatus['in-progress'] },
    { id: 'review', title: 'Review', tasks: tasksByStatus.review },
    { id: 'done', title: 'Done', tasks: tasksByStatus.done },
  ];

  return (
    <ErrorBoundary 
      level="component" 
      name="Virtual Kanban Board"
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full p-4"
          style={{ height: containerHeight }}
        >
          {columns.map(column => (
            <ErrorBoundary 
              key={column.id}
              level="widget" 
              name={`Kanban Column: ${column.title}`}
            >
              <VirtualKanbanColumn
                title={column.title}
                status={column.id}
                tasks={column.tasks}
                onEditTask={onEditTask}
                onAddTask={() => onAddTask(column.id)}
                containerHeight={containerHeight}
                enableVirtualization={enableVirtualization}
              />
            </ErrorBoundary>
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-90 rotate-2 scale-105">
              {(() => {
                const task = tasks.find(t => t.id === activeId);
                return task ? (
                  <div className="p-2">
                    <KanbanCard task={task} onEdit={() => {}} />
                  </div>
                ) : null;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ErrorBoundary>
  );
}

// Enhanced calendar view with virtual scrolling for large month views
interface VirtualCalendarGridProps {
  days: Array<{
    date: Date;
    tasks: Task[];
    isCurrentMonth: boolean;
    isToday: boolean;
  }>;
  onDateSelect: (date: Date) => void;
  containerHeight?: number;
  enableVirtualization?: boolean;
}

export function VirtualCalendarGrid({
  days,
  onDateSelect,
  containerHeight = 600,
  enableVirtualization = true,
}: VirtualCalendarGridProps) {
  const getItemHeight = (day: any, index: number) => {
    return 120; // Fixed height for calendar cells
  };

  const renderCalendarDay = (day: any, index: number) => (
    <div
      key={`${day.date.getTime()}-${index}`}
      className={`
        border border-gray-200 p-2 min-h-[120px] cursor-pointer hover:bg-gray-50
        ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
        ${day.isToday ? 'ring-2 ring-blue-500' : ''}
      `}
      onClick={() => onDateSelect(day.date)}
    >
      <div className="font-medium text-sm mb-1">
        {day.date.getDate()}
      </div>
      <div className="space-y-1">
        {day.tasks.slice(0, 3).map((task: Task) => (
          <div
            key={task.id}
            className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
          >
            {task.title}
          </div>
        ))}
        {day.tasks.length > 3 && (
          <div className="text-xs text-gray-500">
            +{day.tasks.length - 3} more
          </div>
        )}
      </div>
    </div>
  );

  if (enableVirtualization && days.length > 42) {
    return (
      <VirtualScroll
        items={days.map(day => ({ ...day, id: day.date.getTime().toString() }))}
        itemHeight={120}
        containerHeight={containerHeight}
        overscan={7} // Show one extra week
        renderItem={renderCalendarDay}
        getItemHeight={getItemHeight}
        className="grid grid-cols-7 gap-0"
      />
    );
  }

  return (
    <div className="grid grid-cols-7 gap-0 border border-gray-200">
      {days.map((day, index) => renderCalendarDay(day, index))}
    </div>
  );
}