import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { Task, Category, TaskPriority, TaskStatus } from '../../shared/types'

// Mock theme provider for components that use theming
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="theme-provider" className="light">
      {children}
    </div>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    wrapper: MockThemeProvider,
    ...options,
  })
}

// Factory functions for creating test data
export const createMockTask = (overrides: Partial<Task> = {}): Task => {
  const baseTask: Task = {
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Task',
    description: 'This is a test task',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['test'],
    subtasks: [],
    estimatedTime: 30,
  }
  
  return { ...baseTask, ...overrides }
}

export const createMockCategory = (overrides: Partial<Category> = {}): Category => {
  const baseCategory: Category = {
    id: `category-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Category',
    color: '#3B82F6',
    icon: 'folder',
    createdAt: new Date(),
  }
  
  return { ...baseCategory, ...overrides }
}

// Mock store state
export const createMockStoreState = () => ({
  tasks: [
    createMockTask({ title: 'First Task', priority: 'high' }),
    createMockTask({ title: 'Second Task', status: 'completed' }),
    createMockTask({ title: 'Third Task', priority: 'low' }),
  ],
  categories: [
    createMockCategory({ name: 'Work', color: '#3B82F6' }),
    createMockCategory({ name: 'Personal', color: '#10B981' }),
  ],
  selectedCategory: undefined,
  filters: {},
  settings: {
    theme: 'system' as const,
    primaryColor: '#3B82F6',
    enableNotifications: true,
    defaultView: 'list' as const,
    autoDeleteCompletedTasks: false,
    pomodoroTimer: {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
    },
  },
  isLoading: false,
})

// Mock functions
export const mockStoreFunctions = {
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  toggleTask: vi.fn(),
  addCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  setFilters: vi.fn(),
  clearFilters: vi.fn(),
  setSelectedCategory: vi.fn(),
  updateSettings: vi.fn(),
  getFilteredTasks: vi.fn(),
  getTasksByCategory: vi.fn(),
  getCompletedTasksCount: vi.fn(),
  getPendingTasksCount: vi.fn(),
}

// Mock Zustand store
export const mockUseTodoStore = vi.fn(() => ({
  ...createMockStoreState(),
  ...mockStoreFunctions,
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Helper to wait for async operations
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to create file download mock
export const mockFileDownload = () => {
  const mockLink = {
    click: vi.fn(),
    href: '',
    download: '',
  }
  
  const mockCreateElement = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'a') {
      return mockLink as any
    }
    return document.createElement(tagName)
  })
  
  const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
  const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)
  
  return {
    mockLink,
    mockCreateElement,
    mockAppendChild,
    mockRemoveChild,
    cleanup: () => {
      mockCreateElement.mockRestore()
      mockAppendChild.mockRestore()
      mockRemoveChild.mockRestore()
    }
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }