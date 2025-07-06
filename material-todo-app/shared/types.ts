export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string;
  tags: string[];
  subtasks: Subtask[];
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
}

export interface FilterOptions {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  categoryId?: string;
  search?: string;
  tags?: string[];
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  enableNotifications: boolean;
  defaultView: 'list' | 'board' | 'calendar';
  autoDeleteCompletedTasks: boolean;
  pomodoroTimer: {
    workDuration: number;
    shortBreak: number;
    longBreak: number;
  };
}

export interface AppState {
  tasks: Task[];
  categories: Category[];
  selectedCategory?: string;
  filters: FilterOptions;
  settings: AppSettings;
  isLoading: boolean;
}