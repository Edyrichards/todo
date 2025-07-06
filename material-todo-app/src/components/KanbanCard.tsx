import { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  User, 
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Pause
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Task } from '../../shared/types';
import { usePWATodoStore } from '../store/todoStorePWA';
import { KanbanUtils } from '../lib/kanbanUtils';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ task, onClick, onEdit, onDelete, isDragging, style, ...props }, ref) => {
    const { toggleTask, deleteTask, categories } = usePWATodoStore();

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: sortableIsDragging,
    } = useSortable({
      id: task.id,
      data: {
        type: 'task',
        task,
      },
    });

    const sortableStyle = {
      transform: CSS.Transform.toString(transform),
      transition,
      ...style,
    };

    const isCurrentlyDragging = isDragging || sortableIsDragging;

    const category = task.categoryId 
      ? categories.find(cat => cat.id === task.categoryId)
      : null;

    const dueDateInfo = task.dueDate 
      ? KanbanUtils.formatDueDate(new Date(task.dueDate))
      : null;

    const priorityColor = KanbanUtils.getPriorityColor(task.priority);
    
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    const totalSubtasks = task.subtasks.length;
    const hasSubtasks = totalSubtasks > 0;

    const getStatusIcon = () => {
      switch (task.status) {
        case 'completed':
          return <CheckCircle2 size={14} className="text-green-600" />;
        case 'in-progress':
          return <Pause size={14} className="text-blue-600" />;
        default:
          return <Circle size={14} className="text-gray-400" />;
      }
    };

    const handleToggleComplete = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleTask(task.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete();
      } else {
        deleteTask(task.id);
      }
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onEdit) {
        onEdit();
      }
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={sortableStyle}
        {...attributes}
        {...listeners}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        whileHover={{ y: -2 }}
        className={cn(
          'cursor-pointer',
          isCurrentlyDragging && 'opacity-50 rotate-2 scale-105'
        )}
        onClick={onClick}
        {...props}
      >
        <Card className={cn(
          'group transition-all duration-200 hover:shadow-md border-l-4',
          task.status === 'completed' && 'opacity-60 bg-muted/30'
        )} 
        style={{ borderLeftColor: priorityColor }}>
          <CardContent className="p-4">
            {/* Header with status and actions */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleToggleComplete}
                  className="transition-transform hover:scale-110"
                >
                  {getStatusIcon()}
                </button>
                {task.priority === 'high' && (
                  <AlertTriangle size={14} className="text-red-500" />
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600"
                  >
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Task Title */}
            <h3 className={cn(
              'font-medium text-sm mb-2 line-clamp-2',
              task.status === 'completed' && 'line-through'
            )}>
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{task.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Category */}
            {category && (
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {category.name}
                </span>
              </div>
            )}

            {/* Footer with metadata */}
            <div className="space-y-2">
              {/* Due Date */}
              {dueDateInfo && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  dueDateInfo.isOverdue ? 'text-red-600' : 
                  dueDateInfo.isToday ? 'text-orange-600' : 'text-muted-foreground'
                )}>
                  <Calendar size={12} />
                  <span>{dueDateInfo.text}</span>
                </div>
              )}

              {/* Time Estimate */}
              {task.estimatedTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>{task.estimatedTime}m</span>
                </div>
              )}

              {/* Subtasks Progress */}
              {hasSubtasks && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 size={12} />
                    <span>{completedSubtasks}/{totalSubtasks}</span>
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-1">
                    <div 
                      className="bg-primary rounded-full h-1 transition-all duration-300"
                      style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Assignee placeholder for future enhancement */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1">
                  {/* Avatar placeholder for multi-user support */}
                  <Avatar className="h-6 w-6 border-2 border-white">
                    <AvatarFallback className="text-xs bg-primary/10">
                      <User size={10} />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Priority indicator */}
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: priorityColor }}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

KanbanCard.displayName = 'KanbanCard';