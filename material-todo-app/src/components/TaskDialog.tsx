import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Star,
  Tag,
  CheckSquare,
  Save
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../shared/types';
import { useTodoStore } from '../store/todoStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string | null;
}

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low Priority', color: 'text-green-500' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-500' },
  { value: 'high', label: 'High Priority', color: 'text-red-500' }
];

export function TaskDialog({ isOpen, onClose, taskId }: TaskDialogProps) {
  const { tasks, categories, addTask, updateTask } = useTodoStore();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Get existing task if editing
  const existingTask = taskId ? tasks.find(t => t.id === taskId) : null;
  const isEditing = !!existingTask;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (existingTask) {
        // Populate form with existing task data
        setTitle(existingTask.title);
        setDescription(existingTask.description || '');
        setPriority(existingTask.priority);
        setCategoryId(existingTask.categoryId);
        setDueDate(existingTask.dueDate ? new Date(existingTask.dueDate) : undefined);
        setEstimatedTime(existingTask.estimatedTime?.toString() || '');
        setTags(existingTask.tags);
        setSubtasks(existingTask.subtasks.map(st => ({
          id: st.id,
          title: st.title,
          completed: st.completed
        })));
      } else {
        // Reset form for new task
        setTitle('');
        setDescription('');
        setPriority('medium');
        setCategoryId(undefined);
        setDueDate(undefined);
        setEstimatedTime('');
        setTags([]);
        setSubtasks([]);
      }
      setNewTag('');
      setNewSubtask('');
    }
  }, [isOpen, existingTask]);

  const handleSave = () => {
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: (existingTask?.status || 'pending') as TaskStatus,
      categoryId,
      dueDate,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      tags,
      subtasks: subtasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed,
        createdAt: new Date()
      }))
    };

    if (isEditing && taskId) {
      updateTask(taskId, taskData);
    } else {
      addTask(taskData);
    }

    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, {
        id: Date.now().toString(),
        title: newSubtask.trim(),
        completed: false
      }]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId));
  };

  const toggleSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details about this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Priority and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Star size={14} className={option.color} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId || 'none'} onValueChange={(value) => setCategoryId(value === 'none' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Estimated Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDueDate(undefined)}
                        className="w-full"
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Estimated Time */}
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="estimatedTime"
                  type="number"
                  placeholder="30"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              <AnimatePresence>
                {tags.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                  >
                    <Badge variant="secondary" className="gap-1">
                      <Tag size={12} />
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeTag(tag)}
                      >
                        <X size={10} />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <Label>Subtasks</Label>
            <div className="space-y-2">
              <AnimatePresence>
                {subtasks.map((subtask) => (
                  <motion.div
                    key={subtask.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                    className="flex items-center gap-2 p-2 rounded bg-muted/50"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleSubtask(subtask.id)}
                    >
                      <CheckSquare 
                        size={14} 
                        className={subtask.completed ? 'text-primary' : 'text-muted-foreground'} 
                      />
                    </Button>
                    <span className={cn(
                      'flex-1 text-sm',
                      subtask.completed && 'line-through text-muted-foreground'
                    )}>
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      <X size={12} />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addSubtask}
                disabled={!newSubtask.trim()}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                disabled={!title.trim()}
                className="gap-2"
              >
                <Save size={16} />
                {isEditing ? 'Update Task' : 'Create Task'}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}