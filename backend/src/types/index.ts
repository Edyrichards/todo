// Shared types between frontend and backend

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedBy?: string;
  invitedAt: Date;
  joinedAt?: Date;
  status: 'pending' | 'active' | 'inactive';
}

export interface Category {
  id: string;
  name: string;
  color: string;
  workspaceId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  categoryId?: string;
  workspaceId: string;
  assignedTo?: string;
  createdBy?: string;
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Recurring task support
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  isTemplate: boolean;
  parentTaskId?: string;
  
  // Kanban support
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  position: number;
  
  // Sync metadata
  version: number;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  
  // Relations
  category?: Category;
  assignedUser?: User;
  creator?: User;
  tags?: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
}

export interface RecurringConfig {
  pattern: RecurringPattern;
  interval: number;
  daysOfWeek?: DayOfWeek[];
  dayOfMonth?: number;
  endDate?: Date;
  maxOccurrences?: number;
  timezone?: string;
}

export type RecurringPattern = 'daily' | 'weekly' | 'monthly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TaskAttachment {
  id: string;
  taskId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedBy?: string;
  createdAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface SyncOperation {
  id: string;
  userId: string;
  workspaceId: string;
  operationType: 'create' | 'update' | 'delete';
  entityType: 'task' | 'category' | 'workspace';
  entityId: string;
  data: any;
  version: number;
  timestamp: Date;
  applied: boolean;
  conflictResolved: boolean;
}

export interface SyncRequest {
  workspaceId: string;
  lastSyncTime: number;
  operations: SyncOperation[];
}

export interface SyncResponse {
  operations: SyncOperation[];
  conflicts: ConflictData[];
  serverTime: number;
}

export interface ConflictData {
  id: string;
  entityType: string;
  entityId: string;
  serverData: any;
  clientData: any;
  conflictFields: string[];
}

// API Request/Response types
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  categoryId?: string;
  assignedTo?: string;
  dueDate?: Date;
  startDate?: Date;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done';
  isRecurring?: boolean;
  recurringConfig?: RecurringConfig;
  tags?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completed?: boolean;
  completedAt?: Date;
  position?: number;
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceInput extends Partial<CreateWorkspaceInput> {
  settings?: Record<string, any>;
}

export interface InviteMemberInput {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

// WebSocket Event types
export interface WebSocketEvents {
  // Client -> Server
  'join_workspace': { workspaceId: string };
  'leave_workspace': { workspaceId: string };
  'task_update': { taskId: string; changes: Partial<Task> };
  'sync_request': { lastSyncTime: number };
  'presence_update': { status: 'online' | 'away' | 'busy' };
  
  // Server -> Client
  'task_created': Task;
  'task_updated': { taskId: string; changes: Partial<Task>; updatedBy: string };
  'task_deleted': { taskId: string; deletedBy: string };
  'category_updated': Category;
  'sync_update': { operations: SyncOperation[] };
  'user_presence': { userId: string; status: string };
  'conflict_detected': { taskId: string; conflicts: ConflictData[] };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  field: string;
}

export interface AuthError extends ApiError {
  code: 'AUTH_ERROR' | 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS';
}

export interface ConflictError extends ApiError {
  code: 'CONFLICT_ERROR';
  conflicts: ConflictData[];
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter types
export interface TaskFilters {
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  categoryId?: string;
  assignedTo?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done';
  dueBefore?: Date;
  dueAfter?: Date;
  tags?: string[];
  search?: string;
}

// Analytics types
export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    taskCount: number;
    completionRate: number;
  }>;
  priorityBreakdown: Array<{
    priority: string;
    taskCount: number;
    completionRate: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    created: number;
    completed: number;
  }>;
}