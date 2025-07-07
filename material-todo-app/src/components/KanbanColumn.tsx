import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, AlertTriangle, Clock } from 'lucide-react';
import { Task } from '../../shared/types';
import { KanbanColumn as KanbanColumnType, KanbanUtils } from '../lib/kanbanUtils';
import { KanbanCard } from './KanbanCard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
}

export function KanbanColumn({ 
  column, 
  tasks, 
  onTaskClick, 
  onCreateTask, 
  onEditTask,
  onDeleteTask 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  const stats = KanbanUtils.getColumnStats(tasks, column.id);
  const taskIds = tasks.map(task => task.id);

  return (
    <Card className={cn(
      'flex flex-col h-full transition-all duration-200',
      isOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <CardTitle className="text-sm font-medium">
              {column.title}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Task count badge */}
            <Badge 
              variant={stats.isOverLimit ? 'destructive' : 'secondary'} 
              className="text-xs"
            >
              {stats.count}
              {column.limit && `/${column.limit}`}
            </Badge>
            
            {/* High priority indicator */}
            {stats.highPriorityCount > 0 && (
              <Badge variant="outline" className="text-xs text-red-600">
                <AlertTriangle size={10} className="mr-1" />
                {stats.highPriorityCount}
              </Badge>
            )}
            
            {/* Overdue indicator */}
            {stats.overdueTasks > 0 && (
              <Badge variant="outline" className="text-xs text-orange-600">
                <Clock size={10} className="mr-1" />
                {stats.overdueTasks}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Column description */}
        {column.description && (
          <p className="text-xs text-muted-foreground">
            {column.description}
          </p>
        )}
        
        {/* Add task button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateTask}
          className="justify-start gap-2 h-8 text-xs border-dashed border-2 border-muted-foreground/20 hover:border-primary/50"
        >
          <Plus size={14} />
          Add task
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-3 pt-0">
        <div 
          ref={setNodeRef}
          className={cn(
            'min-h-full transition-colors duration-200',
            isOver && 'bg-primary/5 rounded-lg'
          )}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <ScrollArea className="h-full">
              <div className="space-y-3 min-h-[200px] pb-4">
                <AnimatePresence mode="popLayout">
                  {tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        delay: index * 0.05,
                        duration: 0.2,
                        layout: { duration: 0.2 }
                      }}
                    >
                      <KanbanCard
                        task={task}
                        onClick={() => onTaskClick?.(task)}
                        onEdit={() => onEditTask?.(task)}
                        onDelete={() => onDeleteTask?.(task)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Empty state */}
                {tasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div 
                      className="w-12 h-12 rounded-full mb-3 flex items-center justify-center opacity-20"
                      style={{ backgroundColor: column.color }}
                    >
                      <Plus size={20} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      No tasks yet
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCreateTask}
                      className="text-xs"
                    >
                      Create your first task
                    </Button>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </SortableContext>
        </div>
      </CardContent>
      
      {/* Column footer with summary */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {tasks.filter(t => t.status === 'completed').length} completed
          </span>
          {stats.isOverLimit && (
            <span className="text-red-600 font-medium">
              Over limit!
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}