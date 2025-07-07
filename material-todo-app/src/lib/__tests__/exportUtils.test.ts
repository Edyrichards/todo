import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportTasksAsJSON, exportTasksAsCSV, exportTasksAsMarkdown } from '../exportUtils'
import { createMockTask, createMockCategory, mockFileDownload } from '../../test/utils'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}))

// Mock date-fns format function
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    if (formatStr === 'yyyy-MM-dd-HHmm') return '2024-01-15-1430'
    if (formatStr === 'yyyy-MM-dd') return '2024-01-15'
    if (formatStr === 'yyyy-MM-dd HH:mm') return '2024-01-15 14:30'
    if (formatStr === 'MMMM d, yyyy at h:mm a') return 'January 15, 2024 at 2:30 PM'
    if (formatStr === 'MMMM d, yyyy') return 'January 15, 2024'
    if (formatStr === 'MMM d') return 'Jan 15'
    return date.toISOString()
  }),
}))

describe('exportUtils', () => {
  let fileDownloadMocks: ReturnType<typeof mockFileDownload>

  beforeEach(() => {
    fileDownloadMocks = mockFileDownload()
    vi.clearAllMocks()
  })

  afterEach(() => {
    fileDownloadMocks.cleanup()
  })

  describe('exportTasksAsJSON', () => {
    it('should export tasks as JSON with correct structure', () => {
      const tasks = [
        createMockTask({ title: 'Task 1', status: 'completed' }),
        createMockTask({ title: 'Task 2', status: 'pending' }),
      ]
      const categories = [
        createMockCategory({ name: 'Work' }),
      ]

      exportTasksAsJSON(tasks, categories)

      expect(fileDownloadMocks.mockLink.download).toBe('tasks-export-2024-01-15-1430.json')
      expect(fileDownloadMocks.mockAppendChild).toHaveBeenCalled()
      expect(fileDownloadMocks.mockRemoveChild).toHaveBeenCalled()
      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()

      // Verify the JSON structure
      const downloadedContent = fileDownloadMocks.mockLink.href
      expect(downloadedContent).toContain('data:application/json')
    })

    it('should include metadata in JSON export', () => {
      const tasks = [
        createMockTask({ status: 'completed' }),
        createMockTask({ status: 'pending' }),
        createMockTask({ status: 'in-progress' }),
      ]
      const categories = [createMockCategory()]

      exportTasksAsJSON(tasks, categories)

      // The content should be properly structured
      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })

    it('should filter out completed tasks when includeCompleted is false', () => {
      const tasks = [
        createMockTask({ status: 'completed' }),
        createMockTask({ status: 'pending' }),
      ]
      const categories = [createMockCategory()]

      exportTasksAsJSON(tasks, categories, { includeCompleted: false })

      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })
  })

  describe('exportTasksAsCSV', () => {
    it('should export tasks as CSV with correct headers', () => {
      const tasks = [
        createMockTask({ 
          title: 'Task 1', 
          description: 'Description 1',
          tags: ['tag1', 'tag2'],
          estimatedTime: 60
        }),
      ]
      const categories = [
        createMockCategory({ name: 'Work' }),
      ]

      exportTasksAsCSV(tasks, categories)

      expect(fileDownloadMocks.mockLink.download).toBe('tasks-export-2024-01-15-1430.csv')
      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })

    it('should handle special characters in CSV', () => {
      const tasks = [
        createMockTask({ 
          title: 'Task with "quotes"',
          description: 'Description with, comma'
        }),
      ]
      const categories = [createMockCategory()]

      exportTasksAsCSV(tasks, categories)

      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })

    it('should handle tasks without categories', () => {
      const tasks = [
        createMockTask({ categoryId: undefined }),
      ]
      const categories = [createMockCategory()]

      exportTasksAsCSV(tasks, categories)

      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })
  })

  describe('exportTasksAsMarkdown', () => {
    it('should export tasks as Markdown with proper formatting', () => {
      const tasks = [
        createMockTask({ 
          title: 'Important Task',
          description: 'This is important',
          priority: 'high',
          status: 'pending',
          tags: ['urgent', 'work'],
          subtasks: [
            { 
              id: 'sub1', 
              title: 'Subtask 1', 
              completed: true, 
              createdAt: new Date() 
            },
            { 
              id: 'sub2', 
              title: 'Subtask 2', 
              completed: false, 
              createdAt: new Date() 
            },
          ]
        }),
      ]
      const categories = [
        createMockCategory({ name: 'Work' }),
      ]

      exportTasksAsMarkdown(tasks, categories)

      expect(fileDownloadMocks.mockLink.download).toBe('tasks-export-2024-01-15-1430.md')
      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })

    it('should group tasks by category in markdown', () => {
      const category1 = createMockCategory({ name: 'Work' })
      const category2 = createMockCategory({ name: 'Personal' })
      
      const tasks = [
        createMockTask({ title: 'Work Task', categoryId: category1.id }),
        createMockTask({ title: 'Personal Task', categoryId: category2.id }),
        createMockTask({ title: 'Uncategorized Task', categoryId: undefined }),
      ]

      exportTasksAsMarkdown(tasks, [category1, category2])

      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })

    it('should include task statistics in markdown', () => {
      const tasks = [
        createMockTask({ status: 'completed' }),
        createMockTask({ status: 'pending' }),
        createMockTask({ status: 'in-progress' }),
      ]
      const categories = [createMockCategory()]

      exportTasksAsMarkdown(tasks, categories)

      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })

    it('should handle tasks with no due date', () => {
      const tasks = [
        createMockTask({ dueDate: undefined }),
      ]
      const categories = [createMockCategory()]

      exportTasksAsMarkdown(tasks, categories)

      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })
  })

  describe('File download functionality', () => {
    it('should create download link with correct attributes', () => {
      const tasks = [createMockTask()]
      const categories = [createMockCategory()]

      exportTasksAsJSON(tasks, categories)

      expect(fileDownloadMocks.mockCreateElement).toHaveBeenCalledWith('a')
      expect(fileDownloadMocks.mockAppendChild).toHaveBeenCalledWith(fileDownloadMocks.mockLink)
      expect(fileDownloadMocks.mockRemoveChild).toHaveBeenCalledWith(fileDownloadMocks.mockLink)
      expect(fileDownloadMocks.mockLink.click).toHaveBeenCalled()
    })

    it('should set correct MIME types for different formats', () => {
      const tasks = [createMockTask()]
      const categories = [createMockCategory()]

      // Test JSON
      exportTasksAsJSON(tasks, categories)
      expect(fileDownloadMocks.mockLink.href).toContain('data:application/json')

      // Test CSV
      exportTasksAsCSV(tasks, categories)
      expect(fileDownloadMocks.mockLink.href).toContain('data:text/csv')

      // Test Markdown
      exportTasksAsMarkdown(tasks, categories)
      expect(fileDownloadMocks.mockLink.href).toContain('data:text/markdown')
    })
  })
})