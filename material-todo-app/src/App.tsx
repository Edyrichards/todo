import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodoStore } from './store/todoStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { TaskDialog } from './components/TaskDialog';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useTheme } from './hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function App() {
  const { tasks, getFilteredTasks } = useTodoStore();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const filteredTasks = getFilteredTasks();
  const showWelcome = tasks.length === 0;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close dialogs
      if (event.key === 'Escape') {
        setIsTaskDialogOpen(false);
        setSelectedTaskId(null);
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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateTask = () => {
    setSelectedTaskId(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDialogOpen(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          onCreateTask={handleCreateTask}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <WelcomeScreen onCreateTask={handleCreateTask} />
              </motion.div>
            ) : (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <TaskList 
                  tasks={filteredTasks}
                  onEditTask={handleEditTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      
      {/* Task Dialog */}
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => {
          setIsTaskDialogOpen(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
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
              onClick={handleCreateTask}
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
    </div>
  );
}
