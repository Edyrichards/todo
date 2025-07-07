import { 
  addDays, 
  addWeeks, 
  addMonths,
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  isSameDay,
  isSameMonth,
  isToday,
  format,
  parseISO
} from 'date-fns';
import { Task } from '../../shared/types';

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
}

export class CalendarUtils {
  static getCalendarDates(currentDate: Date, view: CalendarView): CalendarDate[] {
    switch (view) {
      case 'month':
        return this.getMonthDates(currentDate);
      case 'week':
        return this.getWeekDates(currentDate);
      case 'day':
        return this.getDayDates(currentDate);
      default:
        return this.getMonthDates(currentDate);
    }
  }

  static getMonthDates(currentDate: Date): CalendarDate[] {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dates: CalendarDate[] = [];
    let date = startDate;

    while (date <= endDate) {
      dates.push({
        date: new Date(date),
        isCurrentMonth: isSameMonth(date, currentDate),
        isToday: isToday(date),
        isSelected: false,
        tasks: []
      });
      date = addDays(date, 1);
    }

    return dates;
  }

  static getWeekDates(currentDate: Date): CalendarDate[] {
    const weekStart = startOfWeek(currentDate);
    const dates: CalendarDate[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      dates.push({
        date: new Date(date),
        isCurrentMonth: true,
        isToday: isToday(date),
        isSelected: false,
        tasks: []
      });
    }

    return dates;
  }

  static getDayDates(currentDate: Date): CalendarDate[] {
    return [{
      date: new Date(currentDate),
      isCurrentMonth: true,
      isToday: isToday(currentDate),
      isSelected: true,
      tasks: []
    }];
  }

  static navigateCalendar(currentDate: Date, direction: 'prev' | 'next', view: CalendarView): Date {
    switch (view) {
      case 'month': {
        return direction === 'next' ? addMonths(currentDate, 1) : addMonths(currentDate, -1);
      }
      case 'week': {
        return direction === 'next' ? addWeeks(currentDate, 1) : addWeeks(currentDate, -1);
      }
      case 'day': {
        return direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1);
      }
      default:
        return currentDate;
    }
  }

  static getTasksForDate(tasks: Task[], date: Date): Task[] {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
      return isSameDay(taskDate, date);
    });
  }

  static getTasksInDateRange(tasks: Task[], startDate: Date, endDate: Date): Task[] {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
      return taskDate >= startOfDay(startDate) && taskDate <= endOfDay(endDate);
    });
  }

  static formatCalendarTitle(date: Date, view: CalendarView): string {
    switch (view) {
      case 'month': {
        return format(date, 'MMMM yyyy');
      }
      case 'week': {
        const weekStart = startOfWeek(date);
        const weekEnd = endOfWeek(date);
        if (isSameMonth(weekStart, weekEnd)) {
          return format(weekStart, 'MMMM d') + ' - ' + format(weekEnd, 'd, yyyy');
        } else {
          return format(weekStart, 'MMM d') + ' - ' + format(weekEnd, 'MMM d, yyyy');
        }
      }
      case 'day': {
        return format(date, 'EEEE, MMMM d, yyyy');
      }
      default:
        return format(date, 'MMMM yyyy');
    }
  }

  static getCalendarGridCols(view: CalendarView): string {
    switch (view) {
      case 'month': {
        return 'grid-cols-7';
      }
      case 'week': {
        return 'grid-cols-7';
      }
      case 'day': {
        return 'grid-cols-1';
      }
      default:
        return 'grid-cols-7';
    }
  }

  static getTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }

  static isDateInPast(date: Date): boolean {
    return date < startOfDay(new Date());
  }

  static getTaskPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  }

  static getTaskStatusColor(status: 'pending' | 'in-progress' | 'completed'): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}