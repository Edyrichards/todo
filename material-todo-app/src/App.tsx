/*
 * Standard Todo App
 * 
 * For enhanced performance features including:
 * - Virtual scrolling for large task lists (>50 items)
 * - Comprehensive error boundaries with recovery
 * - Real-time performance monitoring
 * - Lazy loading of heavy components
 * 
 * Enable enhanced version by:
 * - Setting VITE_USE_ENHANCED_APP=true in .env
 * - Adding ?enhanced=true to URL
 * - Setting localStorage.setItem('use-enhanced-app', 'true')
 * 
 * See AppEnhanced.tsx for the enhanced implementation
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, scaleIn, slideInLeft } from './lib/animations';
import { useTodoStore } from './store/todoStore';
import { useWebSocketStore, useWebSocketConnection, initializeWebSocket, cleanupWebSocket } from './store/websocketStore';
import { authService, setAuthToken } from './services/apiService';
import { AuthPage } from './pages/AuthPage'; // Create this page
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { CalendarView } from './components/CalendarView';
import { KanbanView } from './components/KanbanView';
import { TaskDialog } from './components/TaskDialog';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PWAProvider } from './components/PWAProvider';
import { PWAStatus } from './components/PWAStatus';
import { ConnectionStatus } from './components/ConnectionStatus';
import { UserPresence } from './components/UserPresence';
import { MobileNavigation, useSafeArea } from './components/MobileNavigation';
import { MobileFloatingActionButton } from './components/MobileFloatingActionButton';
import { useTheme } from './hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

type AppView = 'tasks' | 'calendar' | 'kanban';

function AppContent() {
  const { tasks, getFilteredTasks, isLoading: isLoadingTasks, clearLocalTasks } = useTodoStore();
  const { isConnected, isAuthenticated: isWsAuthenticated, updateToken: updateWsToken } = useWebSocketStore(state => ({
    isConnected: state.connectionState.status === 'connected' || state.connectionState.status === 'authenticated',
    isAuthenticated: state.connectionState.status === 'authenticated',
    updateToken: state.client?.updateToken,
  }));

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [defaultDueDate, setDefaultDueDate] = useState<Date | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('tasks');
  const { theme, toggleTheme } = useTheme();
  
  // Initialize mobile safe area support
  useSafeArea();
  
  const { theme, toggleTheme } = useTheme();

  // Initialize mobile safe area support
  useSafeArea();

  const handleLoginSuccess = useCallback(async (userData: any, token: string) => {
    setCurrentUser(userData);
    // Token is already set by setAuthToken in AuthPage, but good to be explicit if needed elsewhere
    // initializeWebSocket will be called by the effect below once currentUser is set
    if (updateWsToken) {
      updateWsToken(token); // Update token for potentially running WS client
    } else {
      // If WS client not yet initialized, it will pick up token on init
      await initializeWebSocket(token, ['default-workspace']);
    }
  }, [updateWsToken]);

  // Check auth status on mount and initialize WebSocket
  useEffect(() => {
    const checkAuthAndInitWS = async () => {
      setIsLoadingAuth(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const user = await authService.fetchMe();
          setCurrentUser(user);
          // Initialize WebSocket with the verified token
          await initializeWebSocket(token, ['default-workspace']); // Ensure workspace IDs are correct
        } catch (error) {
          console.error('Token validation failed or no token:', error);
          setAuthToken(null); // Clear invalid token
          setCurrentUser(null);
          cleanupWebSocket(); // Ensure WS is cleaned up if auth fails
        }
      } else {
        setCurrentUser(null);
        cleanupWebSocket(); // Ensure WS is cleaned up if no token
      }
      setIsLoadingAuth(false);
    };

    checkAuthAndInitWS();
    
    // Cleanup WebSocket on component unmount
    return () => {
      cleanupWebSocket();
    };
  }, []);
  
  const filteredTasks = getFilteredTasks();
  const showWelcome = !isLoadingTasks && !currentUser && tasks.length === 0; // Adjust welcome condition
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close dialogs
      if (event.key === 'Escape') {
        setIsTaskDialogOpen(false);
        setSelectedTaskId(null);
        setDefaultDueDate(undefined);
        setIsSidebarOpen(false);
      }
      
      // Ctrl+N to create new task
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        handleCreateTask();
      }
      
      // Ctrl+/ to toggle sidebar
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }

      // Ctrl+1 for tasks view, Ctrl+2 for calendar view, Ctrl+3 for kanban view
      if (event.ctrlKey && event.key === '1') {
        event.preventDefault();
        setCurrentView('tasks');
      }
      if (event.ctrlKey && event.key === '2') {
        event.preventDefault();
        setCurrentView('calendar');
      }
      if (event.ctrlKey && event.key === '3') {
        event.preventDefault();
        setCurrentView('kanban');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Show loading screen while checking auth or loading tasks
  if (isLoadingAuth || (!currentUser && isLoadingTasks)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {isLoadingAuth ? 'Authenticating...' : 'Loading your tasks...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, show AuthPage
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // User is authenticated, show main app content
  const handleCreateTask = (dueDate?: Date) => {
    setSelectedTaskId(null);
    setDefaultDueDate(dueDate);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDefaultDueDate(undefined);
    setIsTaskDialogOpen(true);
  };

  const handleTaskDialogClose = () => {
    setIsTaskDialogOpen(false);
    setSelectedTaskId(null);
    setDefaultDueDate(undefined);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden pb-[var(--safe-area-bottom,0px)]">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          onCreateTask={() => handleCreateTask()}
          theme={theme}
          onToggleTheme={toggleTheme}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
        
        {/* Status Bar */}
        <div className="border-b bg-muted/30 px-4 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <PWAStatus compact />
            <ConnectionStatus compact />
          </div>
          {isConnected && (
            <UserPresence compact />
          )}
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                key="welcome"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full"
              >
                <WelcomeScreen onCreateTask={() => handleCreateTask()} />
              </motion.div>
            ) : (
              <motion.div
                key={currentView}
                variants={currentView === 'tasks' ? fadeInUp : currentView === 'calendar' ? scaleIn : slideInLeft}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ 
                  duration: 0.4, 
                  ease: [0.4, 0.0, 0.2, 1]
                }}
                className="h-full"
              >
                {currentView === 'tasks' ? (
                  <TaskList 
                    tasks={filteredTasks}
                    onEditTask={handleEditTask}
                  />
                ) : currentView === 'calendar' ? (
                  <CalendarView className="h-full" />
                ) : (
                  <KanbanView className="h-full" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      
      {/* Task Dialog */}
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={handleTaskDialogClose}
        taskId={selectedTaskId}
        defaultDueDate={defaultDueDate}
      />
      
      {/* Floating Action Button for Mobile */}
      {!showWelcome && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 15 }}
          className="fixed bottom-6 right-6 z-50 lg:hidden"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative"
          >
            <Button
              onClick={() => handleCreateTask()}
              size="lg"
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 elevation-3"
            >
              <Plus size={24} />
            </Button>
            {/* Ripple effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 scale-0 animate-ping" />
          </motion.div>
        </motion.div>
      )}
      
      {/* Sidebar Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Mobile Navigation */}
      <MobileNavigation 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      {/* Mobile Floating Action Button */}
      <MobileFloatingActionButton 
        onCreateTask={handleCreateTask}
        onQuickActions={{
          addDueDate: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDefaultDueDate(tomorrow);
            handleCreateTask();
          },
          addReminder: () => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setDefaultDueDate(nextWeek);
            handleCreateTask();
          },
        }}
      />
      
      {/* Toast Notifications */}
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default function App() {
  return (
    <PWAProvider>
      <AppContent />
    </PWAProvider>
  );
}