import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { AppState, Task, Category, TaskPriority, TaskStatus, FilterOptions, AppSettings } from '../../shared/types';

const defaultCategories: Category[] = [
  {
    id: nanoid(),
    name: 'Work',
    color: '#3B82F6',
    icon: 'briefcase',
    createdAt: new Date(),
  },
  {
    id: nanoid(),
    name: 'Personal',
    color: '#10B981',
    icon: 'user',
    createdAt: new Date(),
  },
  {
    id: nanoid(),
    name: 'Shopping',
    color: '#F59E0B',
    icon: 'shopping-cart',
    createdAt: new Date(),
  },
  {
    id: nanoid(),
    name: 'Health',
    color: '#EF4444',
    icon: 'heart',
    createdAt: new Date(),
  },
];

const defaultSettings: AppSettings = {
  theme: 'system',
  primaryColor: '#3B82F6',
  enableNotifications: true,
  defaultView: 'list',
  autoDeleteCompletedTasks: false,
  pomodoroTimer: {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
  },
};

interface TodoStore extends AppState {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Filter actions
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearFilters: () => void;
  setSelectedCategory: (categoryId?: string) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Computed getters
  getFilteredTasks: () => Task[];
  getTasksByCategory: (categoryId: string) => Task[];
  getCompletedTasksCount: () => number;
  getPendingTasksCount: () => number;
}

// Sample tasks for demonstration
const sampleTasks: Task[] = [
  {
    id: nanoid(),
    title: 'Review Material Design guidelines',
    description: 'Go through the latest Material Design 3 specifications and update our component library accordingly.',
    priority: 'high',
    status: 'pending',
    categoryId: defaultCategories[0].id, // Work
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tags: ['design', 'research'],
    subtasks: [
      {
        id: nanoid(),
        title: 'Read color system documentation',
        completed: true,
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Review typography guidelines',
        completed: false,
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Study motion design principles',
        completed: false,
        createdAt: new Date(),
      }
    ],
    estimatedTime: 90,
  },
  {
    id: nanoid(),
    title: 'Grocery shopping',
    description: 'Buy ingredients for this week\'s meal prep',
    priority: 'medium',
    status: 'pending',
    categoryId: defaultCategories[2].id, // Shopping
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    tags: ['food', 'weekly'],
    subtasks: [
      {
        id: nanoid(),
        title: 'Check pantry inventory',
        completed: true,
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Make shopping list',
        completed: false,
        createdAt: new Date(),
      }
    ],
    estimatedTime: 60,
  },
  {
    id: nanoid(),
    title: 'Morning jog',
    description: 'Go for a 30-minute jog in the park',
    priority: 'medium',
    status: 'completed',
    categoryId: defaultCategories[3].id, // Health
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    tags: ['exercise', 'morning'],
    subtasks: [],
    estimatedTime: 30,
    actualTime: 35,
  },
  {
    id: nanoid(),
    title: 'Call mom',
    description: 'Weekly check-in with mom',
    priority: 'high',
    status: 'pending',
    categoryId: defaultCategories[1].id, // Personal
    dueDate: new Date(), // Today
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    tags: ['family'],
    subtasks: [],
    estimatedTime: 20,
  },
  {
    id: nanoid(),
    title: 'Implement user authentication',
    description: 'Add login/logout functionality with JWT tokens and password reset flow',
    priority: 'high',
    status: 'in-progress',
    categoryId: defaultCategories[0].id, // Work
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    tags: ['development', 'backend', 'security'],
    subtasks: [
      {
        id: nanoid(),
        title: 'Set up JWT middleware',
        completed: true,
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Create login endpoint',
        completed: true,
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Implement password reset',
        completed: false,
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Add email verification',
        completed: false,
        createdAt: new Date(),
      }
    ],
    estimatedTime: 240,
  },
  {
    id: nanoid(),
    title: 'Water plants',
    description: 'Water all the indoor plants and check for any issues',
    priority: 'low',
    status: 'pending',
    categoryId: defaultCategories[1].id, // Personal
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    tags: ['plants', 'home'],
    subtasks: [],
    estimatedTime: 15,
  }
];

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      tasks: sampleTasks,
      categories: defaultCategories,
      selectedCategory: undefined,
      filters: {},
      settings: defaultSettings,
      isLoading: false,

      // Task actions
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: nanoid(),
          createdAt: new Date(),
          updatedAt: new Date(),
          subtasks: taskData.subtasks || [],
          tags: taskData.tags || [],
        };
        
        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: task.status === 'completed' ? 'pending' : 'completed',
                  updatedAt: new Date(),
                }
              : task
          ),
        }));
      },

      // Category actions
      addCategory: (categoryData) => {
        const newCategory: Category = {
          ...categoryData,
          id: nanoid(),
          createdAt: new Date(),
        };
        
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, ...updates } : category
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          tasks: state.tasks.map((task) =>
            task.categoryId === id ? { ...task, categoryId: undefined } : task
          ),
        }));
      },

      // Filter actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      setSelectedCategory: (categoryId) => {
        set({ selectedCategory: categoryId });
      },

      // Settings actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Computed getters
      getFilteredTasks: () => {
        const { tasks, filters, selectedCategory } = get();
        let filteredTasks = [...tasks];

        // Filter by selected category
        if (selectedCategory) {
          filteredTasks = filteredTasks.filter(
            (task) => task.categoryId === selectedCategory
          );
        }

        // Filter by status
        if (filters.status && filters.status.length > 0) {
          filteredTasks = filteredTasks.filter((task) =>
            filters.status!.includes(task.status)
          );
        }

        // Filter by priority
        if (filters.priority && filters.priority.length > 0) {
          filteredTasks = filteredTasks.filter((task) =>
            filters.priority!.includes(task.priority)
          );
        }

        // Filter by category
        if (filters.categoryId) {
          filteredTasks = filteredTasks.filter(
            (task) => task.categoryId === filters.categoryId
          );
        }

        // Filter by search term
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredTasks = filteredTasks.filter(
            (task) =>
              task.title.toLowerCase().includes(searchTerm) ||
              task.description?.toLowerCase().includes(searchTerm) ||
              task.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
          );
        }

        // Filter by tags
        if (filters.tags && filters.tags.length > 0) {
          filteredTasks = filteredTasks.filter((task) =>
            filters.tags!.some((tag) => task.tags.includes(tag))
          );
        }

        // Filter by due date range
        if (filters.dueDateRange) {
          filteredTasks = filteredTasks.filter((task) => {
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            const { start, end } = filters.dueDateRange!;
            
            if (start && dueDate < start) return false;
            if (end && dueDate > end) return false;
            
            return true;
          });
        }

        // Sort by priority and due date
        return filteredTasks.sort((a, b) => {
          // First sort by completion status
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (b.status === 'completed' && a.status !== 'completed') return -1;

          // Then by priority
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;

          // Finally by due date
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;

          // Default to creation date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      },

      getTasksByCategory: (categoryId) => {
        const { tasks } = get();
        return tasks.filter((task) => task.categoryId === categoryId);
      },

      getCompletedTasksCount: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.status === 'completed').length;
      },

      getPendingTasksCount: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.status !== 'completed').length;
      },
    }),
    {
      name: 'todo-store',
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
        settings: state.settings,
      }),
    }
  )
);