import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  Clock,
  Edit3,
  MoreHorizontal,
  Star,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Task, TaskPriority } from '../../shared/types';
import { useTodoStore } from '../store/todoStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (taskId: string) => void;
}

const priorityColors = {
  high: 'text-red-500 bg-red-500/10',
  medium: 'text-yellow-500 bg-yellow-500/10',
  low: 'text-green-500 bg-green-500/10'
};

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

export function TaskList({ tasks, onEditTask }: TaskListProps) {
  const { toggleTask, deleteTask, categories } = useTodoStore();

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
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => {
            const category = getCategoryInfo(task.categoryId);
            const isCompleted = task.status === 'completed';
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.3,
                  layout: { duration: 0.2 }
                }}
                whileHover={{ y: -2 }}
                className="group"
              >
                <Card className={cn(
                  'transition-all duration-200 hover:shadow-md border-border/50',
                  isCompleted && 'opacity-60 bg-muted/30',
                  task.priority === 'high' && !isCompleted && 'border-l-4 border-l-red-500',
                  task.priority === 'medium' && !isCompleted && 'border-l-4 border-l-yellow-500'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="mt-1"
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </motion.div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title and Priority */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={cn(
                            'font-medium leading-tight',
                            isCompleted && 'line-through text-muted-foreground'
                          )}>
                            {task.title}
                          </h3>
                          
                          {/* Priority Badge */}
                          {task.priority !== 'low' && (
                            <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                              <Star size={10} className="mr-1" />
                              {priorityLabels[task.priority]}
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className={cn(
                            'text-sm text-muted-foreground',
                            isCompleted && 'line-through'
                          )}>
                            {task.description}
                          </p>
                        )}

                        {/* Meta Information */}
                        <div className="flex items-center gap-4 text-xs">
                          {/* Category */}
                          {category && (
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-muted-foreground">{category.name}</span>
                            </div>
                          )}

                          {/* Due Date */}
                          {task.dueDate && (
                            <div className={cn(
                              'flex items-center gap-1',
                              getDueDateColor(new Date(task.dueDate))
                            )}>
                              <Calendar size={12} />
                              <span>{formatDueDate(new Date(task.dueDate))}</span>
                            </div>
                          )}

                          {/* Estimated Time */}
                          {task.estimatedTime && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock size={12} />
                              <span>{task.estimatedTime}m</span>
                            </div>
                          )}

                          {/* Subtasks Progress */}
                          {task.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CheckCircle2 size={12} />
                              <span>
                                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10"
                          onClick={() => onEditTask(task.id)}
                        >
                          <Edit3 size={14} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}