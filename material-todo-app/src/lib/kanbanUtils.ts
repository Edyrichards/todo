import { Task, TaskStatus } from '../../shared/types';

export type KanbanColumnId = 'todo' | 'in-progress' | 'review' | 'done';

export interface KanbanColumn {
  id: KanbanColumnId;
  title: string;
  status: TaskStatus[];
  color: string;
  limit?: number;
  description?: string;
}

export interface KanbanDragData {
  type: 'task';
  task: Task;
  sourceColumnId: KanbanColumnId;
}

export class KanbanUtils {
  static readonly DEFAULT_COLUMNS: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      status: ['pending'],
      color: '#6B7280',
      description: 'Tasks ready to be started'
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      status: ['in-progress'],
      color: '#3B82F6',
      limit: 3,
      description: 'Currently being worked on'
    },
    {
      id: 'review',
      title: 'In Review',
      status: [], // Custom status - we'll map this appropriately
      color: '#F59E0B',
      description: 'Awaiting review or approval'
    },
    {
      id: 'done',
      title: 'Done',
      status: ['completed'],
      color: '#10B981',
      description: 'Completed tasks'
    }
  ];

  static getColumnById(columnId: KanbanColumnId): KanbanColumn | undefined {
    return this.DEFAULT_COLUMNS.find(col => col.id === columnId);
  }

  static getColumnForTask(task: Task): KanbanColumnId {
    // Map task status to kanban column
    switch (task.status) {
      case 'pending':
        return 'todo';
      case 'in-progress':
        return 'in-progress';
      case 'completed':
        return 'done';
      default:
        // For any unmapped status, check if it has review-related keywords
        if (task.tags.some(tag => tag.toLowerCase().includes('review')) || 
            task.description?.toLowerCase().includes('review')) {
          return 'review';
        }
        return 'todo';
    }
  }

  static getTasksForColumn(tasks: Task[], columnId: KanbanColumnId): Task[] {
    return tasks.filter(task => this.getColumnForTask(task) === columnId);
  }

  static getStatusForColumn(columnId: KanbanColumnId): TaskStatus {
    switch (columnId) {
      case 'todo':
        return 'pending';
      case 'in-progress':
        return 'in-progress';
      case 'review':
        return 'in-progress'; // We'll use in-progress for review items
      case 'done':
        return 'completed';
      default:
        return 'pending';
    }
  }

  static updateTaskForColumn(task: Task, targetColumnId: KanbanColumnId): Partial<Task> {
    const updates: Partial<Task> = {
      status: this.getStatusForColumn(targetColumnId)
    };

    // Add review tag when moving to review column
    if (targetColumnId === 'review') {
      const hasReviewTag = task.tags.includes('review');
      if (!hasReviewTag) {
        updates.tags = [...task.tags, 'review'];
      }
    }

    // Remove review tag when moving out of review column
    if (targetColumnId !== 'review' && task.tags.includes('review')) {
      updates.tags = task.tags.filter(tag => tag !== 'review');
    }

    return updates;
  }

  static getColumnStats(tasks: Task[], columnId: KanbanColumnId) {
    const columnTasks = this.getTasksForColumn(tasks, columnId);
    const column = this.getColumnById(columnId);
    
    return {
      count: columnTasks.length,
      limit: column?.limit,
      isOverLimit: column?.limit ? columnTasks.length > column.limit : false,
      highPriorityCount: columnTasks.filter(task => task.priority === 'high').length,
      overdueTasks: columnTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
      ).length
    };
  }

  static getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  }

  static formatDueDate(dueDate: Date): { text: string; isOverdue: boolean; isToday: boolean } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    const isOverdue = taskDate < today;
    const isToday = taskDate.getTime() === today.getTime();
    
    if (isToday) {
      return { text: 'Today', isOverdue: false, isToday: true };
    }
    
    if (isOverdue) {
      const daysOverdue = Math.ceil((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`, isOverdue: true, isToday: false };
    }
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return { text: 'Tomorrow', isOverdue: false, isToday: false };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, isOverdue: false, isToday: false };
    } else {
      return { 
        text: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        isOverdue: false, 
        isToday: false 
      };
    }
  }
}