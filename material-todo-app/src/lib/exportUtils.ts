import { Task, Category } from '../../shared/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export type ExportFormat = 'json' | 'csv' | 'markdown';

export interface ExportOptions {
  includeCompleted?: boolean;
  includeArchived?: boolean;
  categoryFilter?: string;
}

/**
 * Downloads a file with the given content and filename
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Exports tasks in JSON format
 */
export function exportTasksAsJSON(
  tasks: Task[], 
  categories: Category[], 
  options: ExportOptions = {}
): void {
  const filteredTasks = filterTasks(tasks, options);
  
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    tasks: filteredTasks,
    categories: categories,
    metadata: {
      totalTasks: filteredTasks.length,
      completedTasks: filteredTasks.filter(t => t.status === 'completed').length,
      pendingTasks: filteredTasks.filter(t => t.status === 'pending').length,
      inProgressTasks: filteredTasks.filter(t => t.status === 'in-progress').length,
    }
  };

  const content = JSON.stringify(exportData, null, 2);
  const filename = `tasks-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
  downloadFile(content, filename, 'application/json');
  
  toast.success(`Exported ${filteredTasks.length} tasks as JSON`, {
    description: `Downloaded as ${filename}`
  });
}

/**
 * Exports tasks in CSV format
 */
export function exportTasksAsCSV(
  tasks: Task[], 
  categories: Category[], 
  options: ExportOptions = {}
): void {
  const filteredTasks = filterTasks(tasks, options);
  const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

  const headers = [
    'Title',
    'Description',
    'Status',
    'Priority',
    'Category',
    'Due Date',
    'Created Date',
    'Updated Date',
    'Tags',
    'Estimated Time (min)',
    'Actual Time (min)',
    'Subtasks Count',
    'Completed Subtasks'
  ];

  const rows = filteredTasks.map(task => [
    `"${task.title.replace(/"/g, '""')}"`,
    `"${(task.description || '').replace(/"/g, '""')}"`,
    task.status,
    task.priority,
    categoryMap.get(task.categoryId || '') || '',
    task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm'),
    format(new Date(task.updatedAt), 'yyyy-MM-dd HH:mm'),
    `"${task.tags.join(', ')}"`,
    task.estimatedTime || '',
    task.actualTime || '',
    task.subtasks.length,
    task.subtasks.filter(st => st.completed).length
  ]);

  const content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const filename = `tasks-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  downloadFile(content, filename, 'text/csv');
  
  toast.success(`Exported ${filteredTasks.length} tasks as CSV`, {
    description: `Downloaded as ${filename}`
  });
}

/**
 * Exports tasks in Markdown format
 */
export function exportTasksAsMarkdown(
  tasks: Task[], 
  categories: Category[], 
  options: ExportOptions = {}
): void {
  const filteredTasks = filterTasks(tasks, options);
  const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

  let content = `# Task Export\n\n`;
  content += `**Export Date:** ${format(new Date(), 'MMMM d, yyyy at h:mm a')}\n\n`;
  
  // Summary statistics
  const completedCount = filteredTasks.filter(t => t.status === 'completed').length;
  const pendingCount = filteredTasks.filter(t => t.status === 'pending').length;
  const inProgressCount = filteredTasks.filter(t => t.status === 'in-progress').length;
  
  content += `## Summary\n\n`;
  content += `- **Total Tasks:** ${filteredTasks.length}\n`;
  content += `- **Completed:** ${completedCount}\n`;
  content += `- **In Progress:** ${inProgressCount}\n`;
  content += `- **Pending:** ${pendingCount}\n\n`;

  // Group tasks by category
  const tasksByCategory = new Map<string, Task[]>();
  filteredTasks.forEach(task => {
    const categoryName = categoryMap.get(task.categoryId || '') || 'Uncategorized';
    if (!tasksByCategory.has(categoryName)) {
      tasksByCategory.set(categoryName, []);
    }
    tasksByCategory.get(categoryName)!.push(task);
  });

  // Export tasks by category
  for (const [categoryName, categoryTasks] of tasksByCategory) {
    content += `## ${categoryName}\n\n`;
    
    categoryTasks.forEach(task => {
      const statusIcon = getStatusIcon(task.status);
      const priorityBadge = getPriorityBadge(task.priority);
      
      content += `### ${statusIcon} ${task.title} ${priorityBadge}\n\n`;
      
      if (task.description) {
        content += `${task.description}\n\n`;
      }
      
      content += `**Details:**\n`;
      content += `- Status: ${task.status}\n`;
      content += `- Priority: ${task.priority}\n`;
      
      if (task.dueDate) {
        content += `- Due Date: ${format(new Date(task.dueDate), 'MMMM d, yyyy')}\n`;
      }
      
      if (task.tags.length > 0) {
        content += `- Tags: ${task.tags.map(tag => `\`${tag}\``).join(', ')}\n`;
      }
      
      if (task.estimatedTime) {
        content += `- Estimated Time: ${task.estimatedTime} minutes\n`;
      }
      
      if (task.actualTime) {
        content += `- Actual Time: ${task.actualTime} minutes\n`;
      }
      
      // Subtasks
      if (task.subtasks.length > 0) {
        content += `\n**Subtasks:**\n\n`;
        task.subtasks.forEach(subtask => {
          const subtaskIcon = subtask.completed ? '✅' : '⏳';
          content += `- ${subtaskIcon} ${subtask.title}\n`;
        });
      }
      
      content += `\n---\n\n`;
    });
  }

  const filename = `tasks-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.md`;
  downloadFile(content, filename, 'text/markdown');
  
  toast.success(`Exported ${filteredTasks.length} tasks as Markdown`, {
    description: `Downloaded as ${filename}`
  });
}

/**
 * Filters tasks based on export options
 */
function filterTasks(tasks: Task[], options: ExportOptions): Task[] {
  let filtered = [...tasks];

  if (!options.includeCompleted) {
    filtered = filtered.filter(task => task.status !== 'completed');
  }

  if (options.categoryFilter) {
    filtered = filtered.filter(task => task.categoryId === options.categoryFilter);
  }

  return filtered;
}

/**
 * Gets status icon for markdown export
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in-progress':
      return '🔄';
    case 'pending':
      return '⏳';
    default:
      return '📝';
  }
}

/**
 * Gets priority badge for markdown export
 */
function getPriorityBadge(priority: string): string {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '';
  }
}