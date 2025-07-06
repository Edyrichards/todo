import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  Plus, 
  Search, 
  Sun, 
  Moon, 
  Monitor,
  Bell,
  Settings
} from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onMenuClick: () => void;
  onCreateTask: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
}

export function Header({ onMenuClick, onCreateTask, theme, onToggleTheme }: HeaderProps) {
  const { filters, setFilters, getPendingTasksCount, getCompletedTasksCount } = useTodoStore();
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const pendingCount = getPendingTasksCount();
  const completedCount = getCompletedTasksCount();

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setFilters({ search: value || undefined });
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} />;
      case 'dark':
        return <Moon size={20} />;
      default:
        return <Monitor size={20} />;
    }
  };

  return (
    <motion.header 
      className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden hover:bg-primary/10"
        >
          <Menu size={20} />
        </Button>
        
        <div className="flex items-center gap-3">
          <motion.h1 
            className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Material Todo
          </motion.h1>
          
          {/* Task Stats */}
          <div className="hidden sm:flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingCount} pending
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {completedCount} done
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-muted/50 border-muted focus:bg-background transition-colors"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="hover:bg-primary/10"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {getThemeIcon()}
          </motion.div>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 hidden sm:flex"
        >
          <Bell size={20} />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 hidden sm:flex"
        >
          <Settings size={20} />
        </Button>

        {/* Create Task FAB */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onCreateTask}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Plus size={16} className="mr-1" />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
}