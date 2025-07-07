import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';
import { MobileFloatingActionButton } from './components/MobileFloatingActionButton';
import { TaskDialog } from './components/TaskDialog';
import { PullToRefresh } from './components/PullToRefresh';
import { VirtualTaskList } from './components/VirtualTaskList';
import { CalendarView } from './components/CalendarView';
import { KanbanView } from './components/KanbanView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RecurringTaskList } from './components/RecurringTaskList';
import { ConnectionStatus } from './components/ConnectionStatus';
import { UserPresence } from './components/UserPresence';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { PWAProvider } from './components/PWAProvider';
import { PWAStatus } from './components/PWAStatus';
import { LoadingSpinner, PageLoader } from './components/ui/loading';
import { PageTransition } from './components/ui/page-transitions';
import { PageIndicator } from './components/ui/page-indicator';
import { PerformanceModeIndicator, AnimatedMetrics } from './components/ui/performance-indicators';
import { VirtualScrollIndicator, ScrollDirectionIndicator } from './components/ui/virtual-scroll-animations';
import { ModeSwitchAnimation, PerformanceLoadingStates } from './components/ui/mode-switch-animations';
import { ErrorRecoveryAnimation, ErrorBoundaryActivation } from './components/ui/error-recovery-animations';
import { TaskInteractionMicroAnimations } from './components/ui/task-micro-animations';
import { PerformanceShowcase } from './components/ui/performance-showcase';

// Error Boundaries
import {
  AppErrorBoundary,
  TaskViewErrorBoundary,
  CalendarViewErrorBoundary,
  KanbanViewErrorBoundary,
  AnalyticsViewErrorBoundary,
  DataOperationErrorBoundary
} from './components/ViewErrorBoundaries';

import { useTodoStore } from './store/todoStore';
import { useWebSocketConnection } from './store/websocketStore';
import { initializeWebSocket } from './services/websocket-client';
import { usePerformanceMonitor } from './components/PerformanceMonitor';
import { Task } from '../shared/types';

type View = 'tasks' | 'calendar' | 'kanban' | 'analytics' | 'recurring';

// Lazy load heavy components for better performance
const LazyAnalyticsDashboard = React.lazy(() => 
  import('./components/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard }))
);

const LazyKanbanView = React.lazy(() => 
  import('./components/KanbanView').then(module => ({ default: module.KanbanView }))
);

const LazyCalendarView = React.lazy(() => 
  import('./components/CalendarView').then(module => ({ default: module.CalendarView }))
);

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('tasks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDueDate, setDefaultDueDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Performance and visual enhancement states
  const [showPerformanceMode, setShowPerformanceMode] = useState(false);
  const [showModeSwitch, setShowModeSwitch] = useState(false);
  const [showPerformanceShowcase, setShowPerformanceShowcase] = useState(false);
  const [isEnhancedMode, setIsEnhancedMode] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 16,
    fps: 60,
    memoryUsage: 15,
    componentCount: 45
  });
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'idle'>('idle');
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [virtualScrollStats, setVirtualScrollStats] = useState({
    isActive: false,
    visibleRange: { start: 0, end: 20 },
    totalItems: 0
  });

  // Performance monitoring
  usePerformanceMonitor('AppEnhanced');

  // Store state
  const {
    tasks,
    searchTerm,
    selectedCategory,
    sortBy,
    refreshTasks,
    isLoading,
    error,
    toggleTask,
    deleteTask,
    updateTask
  } = useTodoStore();

  // WebSocket connection
  const { isConnected, connectionQuality } = useWebSocketConnection();

  // Initialize WebSocket on mount
  useEffect(() => {
    initializeWebSocket();
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll tracking for direction indicator
  useEffect(() => {
    let lastScrollY = 0;
    let lastScrollTime = Date.now();

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const deltaY = currentScrollY - lastScrollY;
      const deltaTime = currentTime - lastScrollTime;

      if (deltaTime > 0) {
        const velocity = Math.abs(deltaY / deltaTime) * 1000; // pixels per second
        setScrollVelocity(velocity);

        if (Math.abs(deltaY) > 5) {
          setScrollDirection(deltaY > 0 ? 'down' : 'up');
        } else {
          setScrollDirection('idle');
        }
      }

      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;
    };

    const throttledScroll = throttle(handleScroll, 16); // 60fps
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  // Performance metrics updates
  useEffect(() => {
    const updateMetrics = () => {
      const renderStart = performance.now();
      
      // Simulate render time measurement
      setTimeout(() => {
        const renderTime = performance.now() - renderStart;
        setPerformanceMetrics(prev => ({
          ...prev,
          renderTime: Math.max(renderTime, filteredTasks.length > 50 ? 16 : renderTime),
          componentCount: 45 + (filteredTasks.length > 50 ? 20 : filteredTasks.length)
        }));
      }, 0);
    };

    updateMetrics();
  }, [filteredTasks.length]);

  // Virtual scrolling stats
  useEffect(() => {
    const isVirtualActive = filteredTasks.length > 50;
    setVirtualScrollStats({
      isActive: isVirtualActive,
      visibleRange: { 
        start: 0, 
        end: Math.min(filteredTasks.length, isVirtualActive ? 20 : filteredTasks.length) 
      },
      totalItems: filteredTasks.length
    });
  }, [filteredTasks.length]);

  // Show performance showcase on first enhanced mode activation
  useEffect(() => {
    const hasSeenShowcase = localStorage.getItem('has-seen-performance-showcase');
    if (isEnhancedMode && !hasSeenShowcase && filteredTasks.length > 0) {
      const timer = setTimeout(() => {
        setShowPerformanceShowcase(true);
        localStorage.setItem('has-seen-performance-showcase', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isEnhancedMode, filteredTasks.length]);

  // Throttle function
  const throttle = (func: (...args: any[]) => void, limit: number) => {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // Filter and sort tasks with performance optimization
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aDate - bDate;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'completed':
          return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
        default: // 'created'
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [tasks, searchTerm, selectedCategory, sortBy]);

  // Handle pull to refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshTasks();
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  };

  // View components with error boundaries
  const renderView = () => {
    const commonProps = {
      key: currentView, // Force remount on view change for better performance
    };

    switch (currentView) {
      case 'tasks': {
        const { toggleTask, deleteTask, updateTask } = useTodoStore.getState();
        
        return (
          <TaskViewErrorBoundary>
            <DataOperationErrorBoundary operation="task loading">
              <div className="space-y-4">
                {/* Performance metrics display */}
                <AnimatedMetrics
                  renderTime={performanceMetrics.renderTime}
                  taskCount={filteredTasks.length}
                  memoryUsage={performanceMetrics.memoryUsage}
                  fps={performanceMetrics.fps}
                />

                {/* Use virtual scrolling for large task lists */}
                {filteredTasks.length > 50 ? (
                  <>
                    <VirtualTaskList
                      tasks={filteredTasks}
                      height={isMobile ? 400 : 600}
                      itemHeight={80}
                      className="flex-1"
                    />
                    <VirtualScrollIndicator
                      isActive={virtualScrollStats.isActive}
                      taskCount={virtualScrollStats.totalItems}
                      visibleRange={virtualScrollStats.visibleRange}
                      onActivate={() => {
                        // Trigger virtual scrolling activation animation
                        setShowPerformanceShowcase(true);
                      }}
                    />
                  </>
                ) : (
                  <div className="space-y-2">
                    {filteredTasks.map((task, index) => (
                      <TaskInteractionMicroAnimations
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onEdit={(id) => {
                          const task = filteredTasks.find(t => t.id === id);
                          if (task) setEditingTask(task);
                        }}
                        onDelete={deleteTask}
                        onPriorityChange={(id, priority) => {
                          updateTask(id, { priority });
                        }}
                        index={index}
                      />
                    ))}
                  </div>
                )}
                
                {filteredTasks.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-50">📝</div>
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No tasks found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || selectedCategory !== 'all' 
                        ? 'Try adjusting your filters'
                        : 'Create your first task to get started'
                      }
                    </p>
                  </div>
                )}
              </div>
            </DataOperationErrorBoundary>
          </TaskViewErrorBoundary>
        );
      }

      case 'calendar':
        return (
          <CalendarViewErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading calendar..." />}>
              <LazyCalendarView
                {...commonProps}
                onTaskSelect={setEditingTask}
                onDateSelect={(date) => {
                  setDefaultDueDate(date);
                  setEditingTask({} as Task);
                }}
              />
            </Suspense>
          </CalendarViewErrorBoundary>
        );

      case 'kanban':
        return (
          <KanbanViewErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading Kanban board..." />}>
              <LazyKanbanView
                {...commonProps}
                onTaskSelect={setEditingTask}
                onCreateTask={(defaults) => setEditingTask({ ...({} as Task), ...defaults })}
              />
            </Suspense>
          </KanbanViewErrorBoundary>
        );

      case 'analytics':
        return (
          <AnalyticsViewErrorBoundary>
            <Suspense fallback={<PageLoader message="Generating analytics..." />}>
              <LazyAnalyticsDashboard {...commonProps} />
            </Suspense>
          </AnalyticsViewErrorBoundary>
        );

      case 'recurring':
        return (
          <DataOperationErrorBoundary operation="recurring task loading">
            <RecurringTaskList
              {...commonProps}
              onEditTemplate={setEditingTask}
            />
          </DataOperationErrorBoundary>
        );

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground">
              View not found
            </h3>
          </div>
        );
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold">Application Error</h2>
          <p className="text-muted-foreground">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Performance Mode Indicator */}
      <PerformanceModeIndicator
        isEnhanced={isEnhancedMode}
        taskCount={filteredTasks.length}
        isVirtual={virtualScrollStats.isActive}
        renderTime={performanceMetrics.renderTime}
        onToggleMode={() => setShowModeSwitch(true)}
      />

      {/* Scroll Direction Indicator */}
      <ScrollDirectionIndicator
        direction={scrollDirection}
        velocity={scrollVelocity}
      />

      {/* Connection status */}
      <ConnectionStatus 
        isConnected={isConnected} 
        quality={connectionQuality}
      />
      
      {/* PWA status */}
      <PWAStatus />
      
      {/* User presence */}
      <UserPresence />

      {/* Header */}
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onCreateTask={() => {
          setEditingTask({} as Task);
          setDefaultDueDate(null);
        }}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false);
          }}
        />

        {/* Main content */}
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          {/* Pull to refresh (mobile only) */}
          {isMobile && (
            <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
              <div className="min-h-screen">
                <div className="container mx-auto px-4 py-6">
                  {/* Page indicator */}
                  <PageIndicator currentStep={Object.keys({ tasks: 0, calendar: 1, kanban: 2, analytics: 3, recurring: 4 }).indexOf(currentView)} totalSteps={5} />
                  
                  {/* Loading overlay */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
                      >
                        <LoadingSpinner size="lg" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* View content with page transitions */}
                  <PageTransition currentView={currentView}>
                    {renderView()}
                  </PageTransition>
                </div>
              </div>
            </PullToRefresh>
          )}

          {/* Desktop content */}
          {!isMobile && (
            <div className="container mx-auto px-6 py-8">
              {/* Page indicator */}
              <PageIndicator currentStep={Object.keys({ tasks: 0, calendar: 1, kanban: 2, analytics: 3, recurring: 4 }).indexOf(currentView)} totalSteps={5} />
              
              {/* Loading overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <LoadingSpinner size="lg" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* View content with page transitions */}
              <PageTransition currentView={currentView}>
                {renderView()}
              </PageTransition>
            </div>
          )}
        </main>
      </div>

      {/* Mobile navigation */}
      {isMobile && (
        <MobileNavigation
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <MobileFloatingActionButton
          onCreateTask={() => {
            setEditingTask({} as Task);
            setDefaultDueDate(null);
          }}
        />
      )}

      {/* Task dialog */}
      <TaskDialog
        isOpen={!!editingTask}
        onClose={() => {
          setEditingTask(null);
          setDefaultDueDate(null);
        }}
        task={editingTask}
        defaultDueDate={defaultDueDate}
      />

      {/* Performance monitor */}
      <PerformanceMonitor
        taskCount={filteredTasks.length}
        isVirtual={filteredTasks.length > 50}
        showDetailedMetrics={process.env.NODE_ENV === 'development'}
      />

      {/* Mode Switch Animation */}
      <AnimatePresence>
        {showModeSwitch && (
          <ModeSwitchAnimation
            currentMode={isEnhancedMode ? 'enhanced' : 'standard'}
            onSwitch={(mode) => {
              setIsEnhancedMode(mode === 'enhanced');
              setShowModeSwitch(false);
              // In a real app, this would trigger app reload with new mode
            }}
            isTransitioning={false}
          />
        )}
      </AnimatePresence>

      {/* Performance Showcase */}
      <AnimatePresence>
        {showPerformanceShowcase && (
          <PerformanceShowcase
            isVisible={showPerformanceShowcase}
            onClose={() => setShowPerformanceShowcase(false)}
          />
        )}
      </AnimatePresence>

      {/* Error Recovery Animations */}
      <ErrorBoundaryActivation
        isVisible={false} // Would be triggered by actual errors
        boundaryLevel="component"
        errorMessage="Sample error for demo"
      />
    </div>
  );
}

export default function AppEnhanced() {
  return (
    <AppErrorBoundary>
      <PWAProvider>
        <Suspense fallback={<PageLoader message="Initializing application..." />}>
          <AppContent />
        </Suspense>
      </PWAProvider>
    </AppErrorBoundary>
  );
}