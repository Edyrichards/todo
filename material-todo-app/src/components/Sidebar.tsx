import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Home,
  Star,
  Trash2,
  X,
  Plus,
  Briefcase,
  User,
  ShoppingCart,
  Heart
} from 'lucide-react';
import { usePWATodoStore } from '../store/todoStorePWA';
import { PWAStatus } from './PWAStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView?: 'tasks' | 'calendar' | 'kanban';
  onViewChange?: (view: 'tasks' | 'calendar' | 'kanban') => void;
}

const iconMap = {
  briefcase: Briefcase,
  user: User,
  'shopping-cart': ShoppingCart,
  heart: Heart,
  home: Home,
  star: Star,
  calendar: Calendar,
  circle: Circle,
};

export function Sidebar({ isOpen, onClose, currentView = 'tasks', onViewChange }: SidebarProps) {
  const { 
    categories, 
    selectedCategory, 
    setSelectedCategory, 
    filters, 
    setFilters,
    clearFilters,
    getFilteredTasks,
    getTasksByCategory,
    tasks
  } = usePWATodoStore();

  const allTasks = getFilteredTasks();
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });
  
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const highPriorityTasks = tasks.filter(task => task.priority === 'high' && task.status !== 'completed');

  const menuItems = [
    {
      id: 'all',
      label: 'All Tasks',
      icon: Home,
      count: allTasks.length,
      isActive: !selectedCategory && !filters.status,
      onClick: () => {
        setSelectedCategory(undefined);
        clearFilters();
      }
    },
    {
      id: 'today',
      label: 'Today',
      icon: Calendar,
      count: todayTasks.length,
      isActive: false,
      onClick: () => {
        setSelectedCategory(undefined);
        setFilters({ 
          dueDateRange: { 
            start: new Date(new Date().setHours(0, 0, 0, 0)),
            end: new Date(new Date().setHours(23, 59, 59, 999))
          }
        });
      }
    },
    {
      id: 'important',
      label: 'Important',
      icon: Star,
      count: highPriorityTasks.length,
      isActive: filters.priority?.includes('high'),
      onClick: () => {
        setSelectedCategory(undefined);
        setFilters({ priority: ['high'] });
      }
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      count: completedTasks.length,
      isActive: filters.status?.includes('completed'),
      onClick: () => {
        setSelectedCategory(undefined);
        setFilters({ status: ['completed'] });
      }
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border z-50 lg:relative lg:translate-x-0"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Navigation</h2>
                <AnimatedButton
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="lg:hidden"
                  animationType="hover"
                >
                  <X size={16} />
                </AnimatedButton>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {/* View Navigation */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Views</h3>
                    <div className="space-y-1">
                      <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatedButton
                          variant={currentView === 'tasks' ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start gap-3 h-10',
                            currentView === 'tasks' && 'bg-primary/10 text-primary'
                          )}
                          onClick={() => onViewChange?.('tasks')}
                          animationType="tap"
                        >
                          <CheckCircle2 size={18} />
                          <span className="flex-1 text-left">Tasks</span>
                        </AnimatedButton>
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatedButton
                          variant={currentView === 'calendar' ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start gap-3 h-10',
                            currentView === 'calendar' && 'bg-primary/10 text-primary'
                          )}
                          onClick={() => onViewChange?.('calendar')}
                          animationType="tap"
                        >
                          <Calendar size={18} />
                          <span className="flex-1 text-left">Calendar</span>
                        </AnimatedButton>
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatedButton
                          variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start gap-3 h-10',
                            currentView === 'kanban' && 'bg-primary/10 text-primary'
                          )}
                          onClick={() => onViewChange?.('kanban')}
                          animationType="tap"
                        >
                          <Briefcase size={18} />
                          <span className="flex-1 text-left">Kanban</span>
                        </AnimatedButton>
                      </motion.div>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Access */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Access</h3>
                    <div className="space-y-1">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant={item.isActive ? 'secondary' : 'ghost'}
                              className={cn(
                                'w-full justify-start gap-3 h-10',
                                item.isActive && 'bg-primary/10 text-primary'
                              )}
                              onClick={item.onClick}
                            >
                              <Icon size={18} />
                              <span className="flex-1 text-left">{item.label}</span>
                              {item.count > 0 && (
                                <Badge 
                                  variant={item.isActive ? 'default' : 'secondary'} 
                                  className="text-xs"
                                >
                                  {item.count}
                                </Badge>
                              )}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Categories */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus size={12} />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {categories.map((category) => {
                        const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Circle;
                        const categoryTasks = getTasksByCategory(category.id);
                        const isActive = selectedCategory === category.id;
                        
                        return (
                          <motion.div
                            key={category.id}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant={isActive ? 'secondary' : 'ghost'}
                              className={cn(
                                'w-full justify-start gap-3 h-10',
                                isActive && 'bg-primary/10 text-primary'
                              )}
                              onClick={() => {
                                setSelectedCategory(category.id);
                                clearFilters();
                              }}
                            >
                              <div 
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: category.color + '20' }}
                              >
                                <IconComponent 
                                  size={12} 
                                  style={{ color: category.color }}
                                />
                              </div>
                              <span className="flex-1 text-left">{category.name}</span>
                              {categoryTasks.length > 0 && (
                                <Badge 
                                  variant={isActive ? 'default' : 'secondary'} 
                                  className="text-xs"
                                >
                                  {categoryTasks.length}
                                </Badge>
                              )}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Filters */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Filters</h3>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-10"
                        onClick={clearFilters}
                      >
                        <Filter size={18} />
                        <span className="flex-1 text-left">Clear Filters</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              {/* PWA Status */}
              <div className="p-4 border-t border-border">
                <PWAStatus />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}