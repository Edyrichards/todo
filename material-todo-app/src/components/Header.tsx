import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Plus, 
  Search, 
  Sun, 
  Moon, 
  Monitor,
  Bell,
  Settings,
  Download,
  FileText,
  Table,
  Code,
  CheckCircle2,
  Calendar,
  Briefcase,
  Mic
} from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { exportTasksAsJSON, exportTasksAsCSV, exportTasksAsMarkdown } from '../lib/exportUtils';
import { VoiceRecordingButton } from './ui/voice-recording-button';
import { VoiceTaskDialog } from './ui/voice-task-dialog';
import { VoiceTaskResult } from '../services/voice-task-service';
import { Task } from '../../shared/types';

interface HeaderProps {
  onMenuClick: () => void;
  onCreateTask: () => void;
  onVoiceTask?: (task: Partial<Task>) => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  currentView?: 'tasks' | 'calendar' | 'kanban';
  onViewChange?: (view: 'tasks' | 'calendar' | 'kanban') => void;
}

export function Header({ onMenuClick, onCreateTask, onVoiceTask, theme, onToggleTheme, currentView = 'tasks', onViewChange }: HeaderProps) {
  const { filters, setFilters, getPendingTasksCount, getCompletedTasksCount, tasks, categories } = useTodoStore();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceTaskResult | null>(null);

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

  const handleExport = (format: 'json' | 'csv' | 'markdown') => {
    switch (format) {
      case 'json':
        exportTasksAsJSON(tasks, categories);
        break;
      case 'csv':
        exportTasksAsCSV(tasks, categories);
        break;
      case 'markdown':
        exportTasksAsMarkdown(tasks, categories);
        break;
    }
  };

  const handleVoiceTaskCreated = (result: VoiceTaskResult) => {
    setVoiceResult(result);
    setShowVoiceDialog(true);
  };

  const handleVoiceTaskConfirm = (task: Partial<Task>) => {
    onVoiceTask?.(task);
    setShowVoiceDialog(false);
    setVoiceResult(null);
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
        <AnimatedButton
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden hover:bg-primary/10"
          animationType="hover"
        >
          <Menu size={20} />
        </AnimatedButton>
        
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
        {/* View Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1 mr-2">
          <AnimatedButton
            variant={currentView === 'tasks' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange?.('tasks')}
            className="gap-2 h-7 px-2"
            animationType="tap"
          >
            <CheckCircle2 size={14} />
            Tasks
          </AnimatedButton>
          <AnimatedButton
            variant={currentView === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange?.('calendar')}
            className="gap-2 h-7 px-2"
            animationType="tap"
          >
            <Calendar size={14} />
            Calendar
          </AnimatedButton>
          <AnimatedButton
            variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange?.('kanban')}
            className="gap-2 h-7 px-2"
            animationType="tap"
          >
            <Briefcase size={14} />
            Kanban
          </AnimatedButton>
        </div>

        {/* Theme Toggle */}
        <AnimatedButton
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="hover:bg-primary/10"
          animationType="hover"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {getThemeIcon()}
          </motion.div>
        </AnimatedButton>

        {/* Notifications */}
        <AnimatedButton
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 hidden sm:flex"
          animationType="hover"
        >
          <Bell size={20} />
        </AnimatedButton>

        {/* Export Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <AnimatedButton
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hidden sm:flex"
              animationType="hover"
            >
              <Download size={20} />
            </AnimatedButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleExport('json')}>
              <Code size={16} className="mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <Table size={16} className="mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('markdown')}>
              <FileText size={16} className="mr-2" />
              Export as Markdown
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <AnimatedButton
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 hidden sm:flex"
          animationType="hover"
        >
          <Settings size={20} />
        </AnimatedButton>

        {/* Voice Task Button */}
        {onVoiceTask && (
          <VoiceRecordingButton
            variant="default"
            onTaskCreated={handleVoiceTaskCreated}
            className="hidden md:flex"
          />
        )}

        {/* Create Task FAB */}
        <AnimatedButton
          onClick={onCreateTask}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl"
          size="sm"
          animationType="elastic"
        >
          <Plus size={16} className="mr-1" />
          <span className="hidden sm:inline">Add Task</span>
          <span className="sm:hidden">Add</span>
        </AnimatedButton>
      </div>

      {/* Voice Task Dialog */}
      {voiceResult && (
        <VoiceTaskDialog
          isOpen={showVoiceDialog}
          onClose={() => setShowVoiceDialog(false)}
          voiceResult={voiceResult}
          onConfirm={handleVoiceTaskConfirm}
          onEdit={() => {/* Handle edit if needed */}}
        />
      )}
    </motion.header>
  );
}