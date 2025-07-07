import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTodoStore } from '../todoStore'
import { createMockTask, createMockCategory } from '../../test/utils'

// Mock nanoid to return predictable IDs
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id'),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('todoStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should initialize with sample data', () => {
    const { result } = renderHook(() => useTodoStore())
    
    expect(result.current.tasks).toHaveLength(6) // Sample tasks
    expect(result.current.categories).toHaveLength(4) // Default categories
    expect(result.current.filters).toEqual({})
    expect(result.current.isLoading).toBe(false)
  })

  describe('Task operations', () => {
    it('should add a new task', () => {
      const { result } = renderHook(() => useTodoStore())
      const initialTaskCount = result.current.tasks.length

      const newTaskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'medium' as const,
        status: 'pending' as const,
        tags: ['test'],
        subtasks: [],
      }

      act(() => {
        result.current.addTask(newTaskData)
      })

      expect(result.current.tasks).toHaveLength(initialTaskCount + 1)
      expect(result.current.tasks[0]).toMatchObject({
        ...newTaskData,
        id: 'mock-id',
      })
      expect(result.current.tasks[0].createdAt).toBeInstanceOf(Date)
      expect(result.current.tasks[0].updatedAt).toBeInstanceOf(Date)
    })

    it('should update an existing task', () => {
      const { result } = renderHook(() => useTodoStore())
      const taskToUpdate = result.current.tasks[0]

      act(() => {
        result.current.updateTask(taskToUpdate.id, {
          title: 'Updated Title',
          priority: 'high',
        })
      })

      const updatedTask = result.current.tasks.find(t => t.id === taskToUpdate.id)
      expect(updatedTask).toMatchObject({
        ...taskToUpdate,
        title: 'Updated Title',
        priority: 'high',
      })
      expect(updatedTask?.updatedAt).not.toEqual(taskToUpdate.updatedAt)
    })

    it('should delete a task', () => {
      const { result } = renderHook(() => useTodoStore())
      const initialTaskCount = result.current.tasks.length
      const taskToDelete = result.current.tasks[0]

      act(() => {
        result.current.deleteTask(taskToDelete.id)
      })

      expect(result.current.tasks).toHaveLength(initialTaskCount - 1)
      expect(result.current.tasks.find(t => t.id === taskToDelete.id)).toBeUndefined()
    })

    it('should toggle task completion status', () => {
      const { result } = renderHook(() => useTodoStore())
      const task = result.current.tasks.find(t => t.status === 'pending')!

      act(() => {
        result.current.toggleTask(task.id)
      })

      const updatedTask = result.current.tasks.find(t => t.id === task.id)
      expect(updatedTask?.status).toBe('completed')

      act(() => {
        result.current.toggleTask(task.id)
      })

      const revertedTask = result.current.tasks.find(t => t.id === task.id)
      expect(revertedTask?.status).toBe('pending')
    })
  })

  describe('Category operations', () => {
    it('should add a new category', () => {
      const { result } = renderHook(() => useTodoStore())
      const initialCategoryCount = result.current.categories.length

      const newCategoryData = {
        name: 'New Category',
        color: '#FF0000',
        icon: 'star',
      }

      act(() => {
        result.current.addCategory(newCategoryData)
      })

      expect(result.current.categories).toHaveLength(initialCategoryCount + 1)
      expect(result.current.categories[initialCategoryCount]).toMatchObject({
        ...newCategoryData,
        id: 'mock-id',
      })
    })

    it('should update an existing category', () => {
      const { result } = renderHook(() => useTodoStore())
      const categoryToUpdate = result.current.categories[0]

      act(() => {
        result.current.updateCategory(categoryToUpdate.id, {
          name: 'Updated Category',
          color: '#00FF00',
        })
      })

      const updatedCategory = result.current.categories.find(c => c.id === categoryToUpdate.id)
      expect(updatedCategory).toMatchObject({
        ...categoryToUpdate,
        name: 'Updated Category',
        color: '#00FF00',
      })
    })

    it('should delete a category and update associated tasks', () => {
      const { result } = renderHook(() => useTodoStore())
      const categoryToDelete = result.current.categories[0]
      const tasksWithCategory = result.current.tasks.filter(t => t.categoryId === categoryToDelete.id)

      act(() => {
        result.current.deleteCategory(categoryToDelete.id)
      })

      expect(result.current.categories.find(c => c.id === categoryToDelete.id)).toBeUndefined()
      
      // Tasks should have their categoryId set to undefined
      tasksWithCategory.forEach(task => {
        const updatedTask = result.current.tasks.find(t => t.id === task.id)
        expect(updatedTask?.categoryId).toBeUndefined()
      })
    })
  })

  describe('Filter operations', () => {
    it('should set filters', () => {
      const { result } = renderHook(() => useTodoStore())

      act(() => {
        result.current.setFilters({
          status: ['pending'],
          priority: ['high'],
          search: 'test',
        })
      })

      expect(result.current.filters).toEqual({
        status: ['pending'],
        priority: ['high'],
        search: 'test',
      })
    })

    it('should clear filters', () => {
      const { result } = renderHook(() => useTodoStore())

      act(() => {
        result.current.setFilters({ search: 'test' })
      })

      expect(result.current.filters.search).toBe('test')

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.filters).toEqual({})
    })

    it('should set selected category', () => {
      const { result } = renderHook(() => useTodoStore())
      const category = result.current.categories[0]

      act(() => {
        result.current.setSelectedCategory(category.id)
      })

      expect(result.current.selectedCategory).toBe(category.id)

      act(() => {
        result.current.setSelectedCategory(undefined)
      })

      expect(result.current.selectedCategory).toBeUndefined()
    })
  })

  describe('Computed getters', () => {
    it('should filter tasks by status', () => {
      const { result } = renderHook(() => useTodoStore())

      act(() => {
        result.current.setFilters({ status: ['completed'] })
      })

      const filteredTasks = result.current.getFilteredTasks()
      expect(filteredTasks.every(task => task.status === 'completed')).toBe(true)
    })

    it('should filter tasks by priority', () => {
      const { result } = renderHook(() => useTodoStore())

      act(() => {
        result.current.setFilters({ priority: ['high'] })
      })

      const filteredTasks = result.current.getFilteredTasks()
      expect(filteredTasks.every(task => task.priority === 'high')).toBe(true)
    })

    it('should filter tasks by search term', () => {
      const { result } = renderHook(() => useTodoStore())

      act(() => {
        result.current.setFilters({ search: 'Review' })
      })

      const filteredTasks = result.current.getFilteredTasks()
      expect(filteredTasks.length).toBeGreaterThan(0)
      expect(filteredTasks.every(task => 
        task.title.toLowerCase().includes('review') ||
        task.description?.toLowerCase().includes('review') ||
        task.tags.some(tag => tag.toLowerCase().includes('review'))
      )).toBe(true)
    })

    it('should sort tasks by completion status, priority, and due date', () => {
      const { result } = renderHook(() => useTodoStore())
      const filteredTasks = result.current.getFilteredTasks()

      // Completed tasks should come last
      const completedIndex = filteredTasks.findIndex(task => task.status === 'completed')
      const pendingIndex = filteredTasks.findIndex(task => task.status !== 'completed')
      
      if (completedIndex !== -1 && pendingIndex !== -1) {
        expect(pendingIndex).toBeLessThan(completedIndex)
      }
    })

    it('should get tasks by category', () => {
      const { result } = renderHook(() => useTodoStore())
      const category = result.current.categories[0]
      const tasksByCategory = result.current.getTasksByCategory(category.id)

      expect(tasksByCategory.every(task => task.categoryId === category.id)).toBe(true)
    })

    it('should count completed tasks correctly', () => {
      const { result } = renderHook(() => useTodoStore())
      const completedCount = result.current.getCompletedTasksCount()
      const actualCompletedCount = result.current.tasks.filter(task => task.status === 'completed').length

      expect(completedCount).toBe(actualCompletedCount)
    })

    it('should count pending tasks correctly', () => {
      const { result } = renderHook(() => useTodoStore())
      const pendingCount = result.current.getPendingTasksCount()
      const actualPendingCount = result.current.tasks.filter(task => task.status !== 'completed').length

      expect(pendingCount).toBe(actualPendingCount)
    })
  })

  describe('Settings operations', () => {
    it('should update settings', () => {
      const { result } = renderHook(() => useTodoStore())

      act(() => {
        result.current.updateSettings({
          theme: 'dark',
          enableNotifications: false,
        })
      })

      expect(result.current.settings.theme).toBe('dark')
      expect(result.current.settings.enableNotifications).toBe(false)
      // Other settings should remain unchanged
      expect(result.current.settings.primaryColor).toBe('#3B82F6')
    })
  })
})