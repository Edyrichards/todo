import { WebSocket } from 'ws';
import { Task, Workspace, User } from './index.js';

// WebSocket connection with user context
export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  workspaceIds?: string[];
  isAuthenticated?: boolean;
  lastPing?: number;
}

// WebSocket event types
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
  workspace: Workspace;
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
  workspaces?: Workspace[];
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

// WebSocket room management
export interface WSRoom {
  workspaceId: string;
  connections: Set<AuthenticatedWebSocket>;
  lastActivity: Date;
}

// WebSocket server configuration
export interface WSServerConfig {
  pingInterval: number; // ms
  connectionTimeout: number; // ms
  maxConnections: number;
  heartbeatInterval: number; // ms
  enablePresence: boolean;
  enableTypingIndicators: boolean;
  enableCursorPositions: boolean;
}

// Connection statistics
export interface WSConnectionStats {
  totalConnections: number;
  authenticatedConnections: number;
  activeRooms: number;
  messagesPerSecond: number;
  lastActivity: Date;
}

// Event handler type
export type WSEventHandler<T = any> = (
  ws: AuthenticatedWebSocket,
  data: T,
  message: WSMessage<T>
) => Promise<void> | void;

// Event subscription
export interface WSEventSubscription {
  eventType: WSEventType;
  handler: WSEventHandler;
  workspaceId?: string;
  userId?: string;
}