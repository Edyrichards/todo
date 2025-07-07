/**
 * WebSocket Event Types for Todo App
 * 
 * These types define the structure of WebSocket messages exchanged
 * between the frontend and backend for real-time communication.
 */

// Re-export frontend types
export type { Task, Category, TaskPriority, TaskStatus } from './types';

// WebSocket Event Types
export enum WSEventType {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  AUTHENTICATE = 'authenticate',
  PING = 'ping',
  PONG = 'pong',
  
  // Task events
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_COMPLETED = 'task:completed',
  TASK_MOVED = 'task:moved',
  
  // Workspace events
  WORKSPACE_CREATED = 'workspace:created',
  WORKSPACE_UPDATED = 'workspace:updated',
  WORKSPACE_DELETED = 'workspace:deleted',
  WORKSPACE_MEMBER_ADDED = 'workspace:member_added',
  WORKSPACE_MEMBER_REMOVED = 'workspace:member_removed',
  
  // Real-time collaboration events
  USER_PRESENCE = 'user:presence',
  USER_TYPING = 'user:typing',
  CURSOR_POSITION = 'cursor:position',
  
  // Sync events
  SYNC_REQUEST = 'sync:request',
  SYNC_RESPONSE = 'sync:response',
  CONFLICT_RESOLUTION = 'conflict:resolution',
  
  // Error events
  ERROR = 'error',
  UNAUTHORIZED = 'unauthorized'
}

// Base WebSocket message structure
export interface WSMessage<T = any> {
  type: WSEventType;
  data: T;
  timestamp: string;
  requestId?: string;
  workspaceId?: string;
}

// Authentication message
export interface WSAuthData {
  token: string;
  workspaceIds?: string[];
}

// Task event data
export interface WSTaskData {
  task: Task;
  workspaceId: string;
  userId: string;
  previousVersion?: Partial<Task>;
}

// Workspace event data
export interface WSWorkspaceData {
  workspace: {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    plan: 'free' | 'pro' | 'enterprise';
    settings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  };
  userId: string;
  member?: {
    userId: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
  };
}

// User presence data
export interface WSPresenceData {
  userId: string;
  workspaceId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  currentTask?: string;
}

// Typing indicator data
export interface WSTypingData {
  userId: string;
  workspaceId: string;
  taskId?: string;
  isTyping: boolean;
}

// Cursor position data
export interface WSCursorData {
  userId: string;
  workspaceId: string;
  taskId?: string;
  position: {
    x: number;
    y: number;
  };
}

// Sync request data
export interface WSSyncRequest {
  workspaceId: string;
  lastSyncTimestamp?: string;
  entities: ('tasks' | 'workspaces')[];
}

// Sync response data
export interface WSSyncResponse {
  workspaceId: string;
  timestamp: string;
  tasks?: Task[];
  workspaces?: WSWorkspaceData['workspace'][];
  deletedTasks?: string[];
  deletedWorkspaces?: string[];
}

// Conflict resolution data
export interface WSConflictData {
  entityType: 'task' | 'workspace';
  entityId: string;
  conflictingVersions: {
    server: any;
    client: any;
  };
  resolution: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  mergedVersion?: any;
}

// Error data
export interface WSErrorData {
  code: string;
  message: string;
  details?: any;
}

// Connection state
export interface WSConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'authenticating' | 'authenticated' | 'error';
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

// User presence state
export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentTask?: string;
}

// Event handler types
export type WSEventHandler<T = any> = (data: T, message: WSMessage<T>) => void;
export type WSErrorHandler = (error: WSErrorData) => void;
export type WSConnectionHandler = () => void;

// WebSocket client configuration
export interface WSClientConfig {
  url: string;
  token?: string;
  workspaceIds?: string[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
  enablePresence?: boolean;
  enableTypingIndicators?: boolean;
}