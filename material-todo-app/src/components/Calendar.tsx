import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Task } from '../../shared/types';
import { useTodoStore } from '../store/todoStore';
import { CalendarUtils, CalendarView, CalendarDate } from '../lib/calendarUtils';
import { format, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CalendarProps {
  onTaskClick?: (task: Task) => void;
  onDateClick?: (date: Date) => void;
  onCreateTask?: (date?: Date) => void;
}

interface CalendarTaskProps {
  task: Task;
  onClick?: () => void;
  compact?: boolean;
}

function CalendarTask({ task, onClick, compact = false }: CalendarTaskProps) {
  const priorityColor = CalendarUtils.getTaskPriorityColor(task.priority);
  const statusColor = CalendarUtils.getTaskStatusColor(task.status);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group cursor-pointer rounded-md border transition-all duration-200',
        compact ? 'p-1 mb-1 text-xs' : 'p-2 mb-2',
        task.status === 'completed' ? 'opacity-60 line-through' : '',
        statusColor
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div className={cn('w-2 h-2 rounded-full mt-1', priorityColor)} />
        <div className="flex-1 min-w-0">
          <div className={cn(
            'font-medium truncate',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {task.title}
          </div>
          {!compact && task.estimatedTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock size={10} />
              <span>{task.estimatedTime}m</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface CalendarDateCellProps {
  calendarDate: CalendarDate;
  view: CalendarView;
  onDateClick?: (date: Date) => void;
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (date: Date) => void;
}

function CalendarDateCell({ 
  calendarDate, 
  view, 
  onDateClick, 
  onTaskClick, 
  onCreateTask 
}: CalendarDateCellProps) {
  const { date, isCurrentMonth, isToday: isTodayDate, tasks } = calendarDate;
  
  const handleDateClick = () => {
    onDateClick?.(date);
  };
  
  const handleCreateTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateTask?.(date);
  };

  const isCompact = view === 'month' && tasks.length > 2;
  const visibleTasks = isCompact ? tasks.slice(0, 2) : tasks;
  const hiddenTasksCount = isCompact ? tasks.length - 2 : 0;

  return (
    <Card 
      className={cn(
        'transition-all duration-200 cursor-pointer group hover:shadow-md',
        view === 'month' ? 'min-h-[120px]' : view === 'week' ? 'min-h-[200px]' : 'min-h-[400px]',
        !isCurrentMonth && view === 'month' && 'opacity-40',
        isTodayDate && 'ring-2 ring-primary ring-offset-2',
        'border-border/50 hover:border-primary/30'
      )}
      onClick={handleDateClick}
    >
      <CardContent className="p-3 h-full">
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            'font-medium',
            isTodayDate ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
            view === 'month' ? 'text-sm' : 'text-lg'
          )}>
            {view === 'month' ? format(date, 'd') : format(date, 'EEE d')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCreateTask}
          >
            <Plus size={12} />
          </Button>
        </div>
        
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {visibleTasks.map((task) => (
              <CalendarTask
                key={task.id}
                task={task}
                onClick={(e) => {
                  e?.stopPropagation();
                  onTaskClick?.(task);
                }}
                compact={view === 'month'}
              />
            ))}
          </AnimatePresence>
          
          {hiddenTasksCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground p-1 text-center bg-muted/50 rounded"
            >
              +{hiddenTasksCount} more
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Calendar({ onTaskClick, onDateClick, onCreateTask }: CalendarProps) {
  const { tasks, filters } = useTodoStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
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
    
    return result;
  }, [tasks, filters]);

  // Generate calendar dates with tasks
  const calendarDates = useMemo(() => {
    const dates = CalendarUtils.getCalendarDates(currentDate, view);
    
    return dates.map(calendarDate => ({
      ...calendarDate,
      tasks: CalendarUtils.getTasksForDate(filteredTasks, calendarDate.date),
      isSelected: selectedDate ? isSameDay(calendarDate.date, selectedDate) : false
    }));
  }, [currentDate, view, filteredTasks, selectedDate]);

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(CalendarUtils.navigateCalendar(currentDate, direction, view));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleTaskClick = (task: Task) => {
    onTaskClick?.(task);
  };

  const handleCreateTask = (date?: Date) => {
    onCreateTask?.(date || selectedDate || new Date());
  };

  const calendarTitle = CalendarUtils.formatCalendarTitle(currentDate, view);
  const gridCols = CalendarUtils.getCalendarGridCols(view);

  const tasksInView = useMemo(() => {
    if (view === 'day' && selectedDate) {
      return CalendarUtils.getTasksForDate(filteredTasks, selectedDate);
    }
    return calendarDates.reduce((acc, date) => acc + date.tasks.length, 0);
  }, [view, selectedDate, filteredTasks, calendarDates]);

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('prev')}
              className="h-8 w-8"
            >
              <ChevronLeft size={16} />
            </Button>
            <h2 className="font-semibold text-lg min-w-[200px] text-center">
              {calendarTitle}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('next')}
              className="h-8 w-8"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="ml-4"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Task Count */}
          <Badge variant="secondary" className="mr-2">
            {tasksInView} task{tasksInView !== 1 ? 's' : ''}
          </Badge>

          {/* View Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon size={16} className="mr-2" />
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setView('month')}>
                Month View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('week')}>
                Week View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('day')}>
                Day View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => handleCreateTask()}
            size="sm"
            className="ml-2"
          >
            <Plus size={16} className="mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Day Labels for Month/Week View */}
      {(view === 'month' || view === 'week') && (
        <div className={cn('grid border-b border-border', gridCols)}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <motion.div
            key={`${currentDate.getTime()}-${view}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn('grid gap-2', gridCols)}
          >
            {calendarDates.map((calendarDate, index) => (
              <CalendarDateCell
                key={calendarDate.date.toISOString()}
                calendarDate={calendarDate}
                view={view}
                onDateClick={handleDateClick}
                onTaskClick={handleTaskClick}
                onCreateTask={handleCreateTask}
              />
            ))}
          </motion.div>
          
          {/* Day View Task List */}
          {view === 'day' && selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-lg font-semibold mb-4">
                Tasks for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              {calendarDates[0]?.tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No tasks scheduled for this day</p>
                  <Button
                    onClick={() => handleCreateTask(selectedDate)}
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {calendarDates[0]?.tasks.map((task) => (
                    <CalendarTask
                      key={task.id}
                      task={task}
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}