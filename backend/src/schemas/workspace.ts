import { z } from 'zod';

// Workspace schemas
export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workspace name is required')
      .max(255, 'Workspace name too long'),
    
    description: z
      .string()
      .max(1000, 'Description too long')
      .optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workspace name is required')
      .max(255, 'Workspace name too long')
      .optional(),
    
    description: z
      .string()
      .max(1000, 'Description too long')
      .optional(),
    
    settings: z
      .record(z.any())
      .optional(),
  }),
});

export const workspaceIdParamSchema = z.object({
  params: z.object({
    workspaceId: z
      .string()
      .uuid('Invalid workspace ID format'),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required')
      .transform(val => val.toLowerCase()),
    
    role: z
      .enum(['admin', 'member', 'viewer'])
      .default('member'),
  }),
});

// Task schemas
export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Task title is required')
      .max(500, 'Task title too long'),
    
    description: z
      .string()
      .max(2000, 'Description too long')
      .optional(),
    
    priority: z
      .enum(['low', 'medium', 'high'])
      .default('medium'),
    
    status: z
      .enum(['todo', 'in_progress', 'in_review', 'done'])
      .default('todo'),
    
    categoryId: z
      .string()
      .uuid('Invalid category ID format')
      .optional(),
    
    assignedTo: z
      .string()
      .uuid('Invalid user ID format')
      .optional(),
    
    dueDate: z
      .string()
      .datetime('Invalid due date format')
      .transform(val => new Date(val))
      .optional(),
    
    startDate: z
      .string()
      .datetime('Invalid start date format')
      .transform(val => new Date(val))
      .optional(),
    
    isRecurring: z
      .boolean()
      .default(false),
    
    recurringConfig: z
      .object({
        pattern: z.enum(['daily', 'weekly', 'monthly']),
        interval: z.number().int().min(1).max(365),
        daysOfWeek: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
        dayOfMonth: z.number().int().min(1).max(31).optional(),
        endDate: z.string().datetime().transform(val => new Date(val)).optional(),
        maxOccurrences: z.number().int().min(1).optional(),
        timezone: z.string().optional(),
      })
      .optional(),
    
    tags: z
      .array(z.string().min(1).max(100))
      .max(10, 'Too many tags')
      .default([]),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Task title is required')
      .max(500, 'Task title too long')
      .optional(),
    
    description: z
      .string()
      .max(2000, 'Description too long')
      .optional(),
    
    completed: z
      .boolean()
      .optional(),
    
    priority: z
      .enum(['low', 'medium', 'high'])
      .optional(),
    
    status: z
      .enum(['todo', 'in_progress', 'in_review', 'done'])
      .optional(),
    
    categoryId: z
      .string()
      .uuid('Invalid category ID format')
      .nullable()
      .optional(),
    
    assignedTo: z
      .string()
      .uuid('Invalid user ID format')
      .nullable()
      .optional(),
    
    dueDate: z
      .string()
      .datetime('Invalid due date format')
      .transform(val => new Date(val))
      .nullable()
      .optional(),
    
    startDate: z
      .string()
      .datetime('Invalid start date format')
      .transform(val => new Date(val))
      .nullable()
      .optional(),
    
    position: z
      .number()
      .int()
      .min(0)
      .optional(),
    
    tags: z
      .array(z.string().min(1).max(100))
      .max(10, 'Too many tags')
      .optional(),
  }),
});

export const taskIdParamSchema = z.object({
  params: z.object({
    workspaceId: z
      .string()
      .uuid('Invalid workspace ID format'),
    
    taskId: z
      .string()
      .uuid('Invalid task ID format'),
  }),
});

export const taskFiltersSchema = z.object({
  querystring: z.object({
    completed: z
      .string()
      .transform(val => val === 'true')
      .optional(),
    
    priority: z
      .enum(['low', 'medium', 'high'])
      .optional(),
    
    status: z
      .enum(['todo', 'in_progress', 'in_review', 'done'])
      .optional(),
    
    categoryId: z
      .string()
      .uuid('Invalid category ID format')
      .optional(),
    
    assignedTo: z
      .string()
      .uuid('Invalid user ID format')
      .optional(),
    
    dueBefore: z
      .string()
      .datetime('Invalid date format')
      .transform(val => new Date(val))
      .optional(),
    
    dueAfter: z
      .string()
      .datetime('Invalid date format')
      .transform(val => new Date(val))
      .optional(),
    
    tags: z
      .string()
      .transform(val => val.split(',').filter(Boolean))
      .optional(),
    
    search: z
      .string()
      .min(1)
      .max(255)
      .optional(),
    
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => val > 0, 'Page must be positive')
      .default('1'),
    
    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .default('20'),
    
    sortBy: z
      .enum(['created_at', 'updated_at', 'due_date', 'priority', 'title'])
      .default('created_at'),
    
    sortOrder: z
      .enum(['asc', 'desc'])
      .default('desc'),
  }),
});

// Category schemas
export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Category name is required')
      .max(100, 'Category name too long'),
    
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be hex)')
      .default('#3B82F6'),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Category name is required')
      .max(100, 'Category name too long')
      .optional(),
    
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be hex)')
      .optional(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    workspaceId: z
      .string()
      .uuid('Invalid workspace ID format'),
    
    categoryId: z
      .string()
      .uuid('Invalid category ID format'),
  }),
});

// Export all schemas
export const workspaceSchemas = {
  create: createWorkspaceSchema,
  update: updateWorkspaceSchema,
  workspaceId: workspaceIdParamSchema,
  inviteMember: inviteMemberSchema,
} as const;

export const taskSchemas = {
  create: createTaskSchema,
  update: updateTaskSchema,
  taskId: taskIdParamSchema,
  filters: taskFiltersSchema,
} as const;

export const categorySchemas = {
  create: createCategorySchema,
  update: updateCategorySchema,
  categoryId: categoryIdParamSchema,
} as const;