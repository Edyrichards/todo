import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Calendar, Clock, Flag, Tag, Mic, Edit3, Check, X } from 'lucide-react';
import { VoiceTaskResult } from '../../services/voice-task-service';
import { Task } from '../../../shared/types';
import { format } from 'date-fns';

interface VoiceTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  voiceResult: VoiceTaskResult;
  onConfirm: (task: Partial<Task>) => void;
  onEdit: () => void;
}

export function VoiceTaskDialog({
  isOpen,
  onClose,
  voiceResult,
  onConfirm,
  onEdit
}: VoiceTaskDialogProps) {
  const [editedTask, setEditedTask] = useState<Partial<Task>>(voiceResult.task);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedTask(voiceResult.task);
    setIsEditing(voiceResult.confidence < 0.8); // Auto-edit if low confidence
  }, [voiceResult]);

  const handleConfirm = () => {
    onConfirm(editedTask);
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High confidence';
    if (confidence >= 0.6) return 'Medium confidence';
    return 'Low confidence - please review';
  };

  const formatDueDate = (date?: Date) => {
    if (!date) return 'No due date';
    return format(date, 'PPp'); // e.g., "Apr 29, 2023 at 3:00 PM"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-500" />
                Voice Task Created
              </DialogTitle>
              <DialogDescription>
                Review your task before adding it to your list
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Original transcript */}
              <div className="bg-muted p-3 rounded-lg">
                <Label className="text-xs text-muted-foreground">You said:</Label>
                <p className="text-sm italic">"{voiceResult.originalText}"</p>
              </div>

              {/* Confidence indicator */}
              <div className="flex items-center justify-between">
                <Badge className={getConfidenceColor(voiceResult.confidence)}>
                  {getConfidenceText(voiceResult.confidence)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(voiceResult.confidence * 100)}% match
                </span>
              </div>

              {/* Task details */}
              <div className="space-y-4">
                {isEditing ? (
                  // Editing mode
                  <>
                    <div>
                      <Label htmlFor="title">Task Title</Label>
                      <Input
                        id="title"
                        value={editedTask.title || ''}
                        onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={editedTask.description || ''}
                        onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add more details..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={editedTask.priority || 'medium'}
                          onValueChange={(value) => setEditedTask(prev => ({ ...prev, priority: value as any }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={editedTask.category || 'general'}
                          onValueChange={(value) => setEditedTask(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="shopping">Shopping</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="home">Home</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dueDate">Due Date (optional)</Label>
                      <Input
                        id="dueDate"
                        type="datetime-local"
                        value={editedTask.dueDate ? format(editedTask.dueDate, "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setEditedTask(prev => ({ ...prev, dueDate: date }));
                        }}
                        className="mt-1"
                      />
                    </div>
                  </>
                ) : (
                  // Preview mode
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <Edit3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{editedTask.title}</h3>
                        {editedTask.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {editedTask.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{editedTask.priority} priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{editedTask.category}</span>
                      </div>
                    </div>

                    {editedTask.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDueDate(editedTask.dueDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="sm:flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Edit
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="sm:flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save Task
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="sm:flex-1"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="sm:flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}