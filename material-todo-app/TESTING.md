# Testing Documentation

## 🧪 Testing Setup

This project uses a comprehensive testing setup with **Vitest**, **React Testing Library**, and **Jest DOM** for robust testing coverage.

## 📁 Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test configuration
│   └── utils.tsx              # Testing utilities and helpers
├── lib/
│   └── __tests__/             # Utility function tests
├── components/
│   └── __tests__/             # Component tests  
├── store/
│   └── __tests__/             # Store/state management tests
└── hooks/
    └── __tests__/             # Custom hook tests
```

## 🛠️ Available Test Commands

```bash
# Run tests in watch mode (development)
bun run test

# Run tests once (CI/production)
bun run test:run

# Run tests with coverage report
bun run test:coverage

# Run tests with UI interface
bun run test:ui

# Run tests in watch mode with specific pattern
bun run test:watch
```

## 🎯 Testing Philosophy

### Test Types
1. **Unit Tests** - Individual functions and utilities
2. **Component Tests** - React component behavior and rendering
3. **Integration Tests** - Component interactions and data flow
4. **Store Tests** - State management and business logic

### Testing Principles
- **Arrange, Act, Assert** pattern
- **User-centric testing** - test what users see and do
- **Accessibility-first** - ensure all interactions are accessible
- **Mock strategically** - mock external dependencies, not implementation details

## 📋 Test Categories

### ✅ Utility Functions (`src/lib/__tests__/`)
- **Text utilities** - highlighting, formatting, validation
- **Export utilities** - file generation and download
- **Date utilities** - formatting and calculations
- **Validation utilities** - form validation and data sanitization

### 🧩 Components (`src/components/__tests__/`)
- **Header component** - search, navigation, theme switching
- **TaskList component** - rendering, drag & drop, keyboard navigation
- **TaskDialog component** - form handling, validation, submission
- **Sidebar component** - navigation, filtering, category management

### 🏪 Store (`src/store/__tests__/`)
- **Task operations** - CRUD operations, state updates
- **Category management** - creation, editing, deletion
- **Filtering logic** - search, status, priority filters
- **Computed getters** - derived state calculations

### 🎣 Hooks (`src/hooks/__tests__/`)
- **useKeyboardNavigation** - keyboard event handling
- **useTheme** - theme switching and persistence
- **Custom form hooks** - form state and validation

## 🔧 Test Configuration

### Vitest Config (`vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    globals: true,           // Global test functions
    environment: 'jsdom',    // Browser-like environment
    setupFiles: ['./src/test/setup.ts'],
    css: true,              // Process CSS imports
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})
```

### Test Setup (`src/test/setup.ts`)
- **Jest DOM matchers** for enhanced assertions
- **Mock globals** (IntersectionObserver, ResizeObserver)
- **Browser API mocks** (matchMedia, navigator.vibrate)
- **Cleanup after each test**

## 🎭 Mocking Strategy

### Global Mocks
```typescript
// Mock IntersectionObserver for components with scrolling
global.IntersectionObserver = class IntersectionObserver {
  observe() { return null }
  disconnect() { return null }
}

// Mock ResizeObserver for responsive components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  disconnect() {}
}
```

### Component Mocks
```typescript
// Mock Framer Motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))

// Mock Zustand store
const mockStore = {
  tasks: [],
  addTask: vi.fn(),
  // ... other store methods
}
```

## 📊 Coverage Reports

### Coverage Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Reports
```bash
# Generate HTML coverage report
bun run test:coverage

# View coverage report
open coverage/index.html
```

### Exclusions
- `node_modules/`
- Test files (`*.test.*`, `*.spec.*`)
- Configuration files (`*.config.*`)
- Type definitions (`*.d.ts`)
- Build output (`dist/`)

## 🚀 Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: bun run test:run

- name: Run tests with coverage
  run: bun run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
bun add -d husky

# Run tests before commit
npx husky add .husky/pre-commit "bun run test:run"
```

## 🎯 Writing Good Tests

### Test Structure
```typescript
describe('ComponentName', () => {
  // Setup and mocks
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user interaction occurs', () => {
    it('should update state correctly', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<Component />)
      
      // Act
      await user.click(screen.getByRole('button'))
      
      // Assert
      expect(screen.getByText('Expected text')).toBeInTheDocument()
    })
  })
})
```

### Best Practices

#### ✅ Do
- Test user behavior, not implementation
- Use semantic queries (`getByRole`, `getByLabelText`)
- Test accessibility (keyboard navigation, screen readers)
- Mock external dependencies
- Use descriptive test names
- Group related tests with `describe`

#### ❌ Don't
- Test implementation details
- Use `data-testid` unless necessary
- Test third-party library functionality
- Write overly complex test setup
- Ignore accessibility in tests

### Query Priority
1. **getByRole** - Most accessible
2. **getByLabelText** - Form elements
3. **getByPlaceholderText** - Input placeholders
4. **getByText** - Visible text content
5. **getByDisplayValue** - Input values
6. **getByAltText** - Image alt text
7. **getByTitle** - Title attributes
8. **getByTestId** - Last resort

## 🔍 Debugging Tests

### Debug Utilities
```typescript
import { screen } from '@testing-library/react'

// Print current DOM structure
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))

// Use logRoles to see available roles
import { logRoles } from '@testing-library/dom'
logRoles(container)
```

### Common Issues
1. **Async operations** - Use `waitFor`, `findBy*` queries
2. **User events** - Use `userEvent` instead of `fireEvent`
3. **Timers** - Mock timers with `vi.useFakeTimers()`
4. **Network requests** - Mock with MSW or similar

## 📈 Test Metrics & Goals

### Current Coverage
- **Components**: 95%+ coverage target
- **Utilities**: 100% coverage target  
- **Store**: 90%+ coverage target
- **Hooks**: 85%+ coverage target

### Quality Metrics
- **Zero flaky tests** - All tests should be deterministic
- **Fast execution** - Test suite should run under 30 seconds
- **Clear failures** - Failing tests should clearly indicate the issue
- **Maintainable** - Tests should be easy to update when code changes

## 🎉 Test Examples

### Component Test Example
```typescript
it('should filter tasks when search term is entered', async () => {
  const user = userEvent.setup()
  render(<TaskList tasks={mockTasks} onEditTask={vi.fn()} />)
  
  const searchInput = screen.getByPlaceholderText('Search tasks...')
  await user.type(searchInput, 'important')
  
  await waitFor(() => {
    expect(screen.getByText('Important Task')).toBeInTheDocument()
    expect(screen.queryByText('Regular Task')).not.toBeInTheDocument()
  })
})
```

### Store Test Example
```typescript
it('should add new task to beginning of list', () => {
  const { result } = renderHook(() => useTodoStore())
  const initialCount = result.current.tasks.length
  
  act(() => {
    result.current.addTask({
      title: 'New Task',
      priority: 'high',
      status: 'pending'
    })
  })
  
  expect(result.current.tasks).toHaveLength(initialCount + 1)
  expect(result.current.tasks[0].title).toBe('New Task')
})
```

---

**Happy Testing! 🧪✨**

Remember: Good tests give you confidence to refactor and add features without breaking existing functionality.