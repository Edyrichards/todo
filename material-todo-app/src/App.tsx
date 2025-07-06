import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, scaleIn, slideInLeft } from './lib/animations';
import { usePWATodoStore } from './store/todoStorePWA';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { CalendarView } from './components/CalendarView';
import { KanbanView } from './components/KanbanView';
import { TaskDialog } from './components/TaskDialog';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PWAProvider } from './components/PWAProvider';
import { PWAStatus } from './components/PWAStatus';
import { MobileNavigation, useSafeArea } from './components/MobileNavigation';
import { MobileFloatingActionButton } from './components/MobileFloatingActionButton';
import { useTheme } from './hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

type AppView = 'tasks' | 'calendar' | 'kanban';

function AppContent() {
  const { tasks, getFilteredTasks, isLoading } = usePWATodoStore();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [defaultDueDate, setDefaultDueDate] = useState<Date | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('tasks');
  const { theme, toggleTheme } = useTheme();
  
  // Initialize mobile safe area support
  useSafeArea();
  
  const filteredTasks = getFilteredTasks();
  const showWelcome = !isLoading && tasks.length === 0;
  
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
  
  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    );
  }

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
        
        {/* PWA Status Bar */}
        <div className="border-b bg-muted/30 px-4 py-2">
          <PWAStatus compact />
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