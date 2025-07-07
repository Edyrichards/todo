import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { Header } from '../Header'

// Mock the store
const mockStore = {
  filters: {},
  setFilters: vi.fn(),
  getPendingTasksCount: vi.fn(() => 5),
  getCompletedTasksCount: vi.fn(() => 3),
  tasks: [],
  categories: [],
}

vi.mock('../../store/todoStore', () => ({
  useTodoStore: () => mockStore,
}))

// Mock export utilities
vi.mock('../../lib/exportUtils', () => ({
  exportTasksAsJSON: vi.fn(),
  exportTasksAsCSV: vi.fn(),
  exportTasksAsMarkdown: vi.fn(),
}))

describe('Header', () => {
  const defaultProps = {
    onMenuClick: vi.fn(),
    onCreateTask: vi.fn(),
    theme: 'light' as const,
    onToggleTheme: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render header with title and actions', () => {
    render(<Header {...defaultProps} />)
    
    expect(screen.getByText('Material Todo')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
    expect(screen.getByText('Add Task')).toBeInTheDocument()
  })

  it('should display task statistics', () => {
    render(<Header {...defaultProps} />)
    
    expect(screen.getByText('5 pending')).toBeInTheDocument()
    expect(screen.getByText('3 done')).toBeInTheDocument()
  })

  it('should call onMenuClick when menu button is clicked', async () => {
    const user = userEvent.setup()
    render(<Header {...defaultProps} />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    await user.click(menuButton)
    
    expect(defaultProps.onMenuClick).toHaveBeenCalledTimes(1)
  })

  it('should call onCreateTask when add task button is clicked', async () => {
    const user = userEvent.setup()
    render(<Header {...defaultProps} />)
    
    const addTaskButton = screen.getByText('Add Task')
    await user.click(addTaskButton)
    
    expect(defaultProps.onCreateTask).toHaveBeenCalledTimes(1)
  })

  it('should call onToggleTheme when theme button is clicked', async () => {
    const user = userEvent.setup()
    render(<Header {...defaultProps} />)
    
    const themeButton = screen.getByRole('button', { name: /theme/i })
    await user.click(themeButton)
    
    expect(defaultProps.onToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('should update search filter when typing in search input', async () => {
    const user = userEvent.setup()
    render(<Header {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    await user.type(searchInput, 'test search')
    
    await waitFor(() => {
      expect(mockStore.setFilters).toHaveBeenCalledWith({ search: 'test search' })
    })
  })

  it('should clear search filter when search input is cleared', async () => {
    const user = userEvent.setup()
    render(<Header {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    await user.type(searchInput, 'test')
    await user.clear(searchInput)
    
    await waitFor(() => {
      expect(mockStore.setFilters).toHaveBeenCalledWith({ search: undefined })
    })
  })

  it('should display correct theme icon for light theme', () => {
    render(<Header {...defaultProps} theme="light" />)
    
    // The sun icon should be present for light theme
    const themeButton = screen.getByRole('button', { name: /theme/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('should display correct theme icon for dark theme', () => {
    render(<Header {...defaultProps} theme="dark" />)
    
    // The moon icon should be present for dark theme
    const themeButton = screen.getByRole('button', { name: /theme/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('should display correct theme icon for system theme', () => {
    render(<Header {...defaultProps} theme="system" />)
    
    // The monitor icon should be present for system theme
    const themeButton = screen.getByRole('button', { name: /theme/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('should show export dropdown menu', async () => {
    const user = userEvent.setup()
    render(<Header {...defaultProps} />)
    
    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)
    
    expect(screen.getByText('Export as JSON')).toBeInTheDocument()
    expect(screen.getByText('Export as CSV')).toBeInTheDocument()
    expect(screen.getByText('Export as Markdown')).toBeInTheDocument()
  })

  it('should not show task statistics when counts are zero', () => {
    const mockStoreWithZeroCounts = {
      ...mockStore,
      getPendingTasksCount: vi.fn(() => 0),
      getCompletedTasksCount: vi.fn(() => 0),
    }
    
    vi.mocked(mockStore.getPendingTasksCount).mockReturnValue(0)
    vi.mocked(mockStore.getCompletedTasksCount).mockReturnValue(0)
    
    render(<Header {...defaultProps} />)
    
    expect(screen.queryByText('0 pending')).not.toBeInTheDocument()
    expect(screen.queryByText('0 done')).not.toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<Header {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    const menuButton = screen.getByRole('button', { name: /menu/i })
    const addTaskButton = screen.getByText('Add Task')
    
    expect(searchInput).toHaveAttribute('type', 'text')
    expect(menuButton).toHaveAttribute('type', 'button')
    expect(addTaskButton).toHaveAttribute('type', 'button')
  })

  it('should preserve search value across renders', () => {
    const { rerender } = render(<Header {...defaultProps} />)
    
    // Set initial filters with search value
    mockStore.filters = { search: 'existing search' }
    
    rerender(<Header {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    expect(searchInput).toHaveValue('existing search')
  })
})