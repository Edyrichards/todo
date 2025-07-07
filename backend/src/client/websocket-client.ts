/**
 * WebSocket Client for Todo App
 * 
 * This file provides a TypeScript client for connecting to the Todo WebSocket server.
 * It can be used as a reference for frontend integration.
 */

import {
  WSEventType,
  WSMessage,
  WSAuthData,
  WSTaskData,
  WSWorkspaceData,
  WSPresenceData,
  WSTypingData,
  WSSyncRequest,
  WSSyncResponse,
  WSErrorData,
} from '../types/websocket.js';

export type WSEventHandler<T = any> = (data: T, message: WSMessage<T>) => void;
export type WSErrorHandler = (error: WSErrorData) => void;
export type WSConnectionHandler = () => void;

export interface WSClientConfig {
  url: string;
  token: string;
  workspaceIds?: string[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
  enablePresence?: boolean;
  enableTypingIndicators?: boolean;
}

export class TodoWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WSClientConfig>;
  private isConnected = false;
  private isAuthenticated = false;
  private reconnectCount = 0;
  private reconnectTimer?: number;
  private pingTimer?: number;
  private lastPong = 0;
  
  // Event handlers
  private eventHandlers = new Map<WSEventType, WSEventHandler[]>();
  private errorHandler?: WSErrorHandler;
  private connectHandler?: WSConnectionHandler;
  private disconnectHandler?: WSConnectionHandler;

  constructor(config: WSClientConfig) {
    this.config = {
      url: config.url,
      token: config.token,
      workspaceIds: config.workspaceIds || [],
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 5000,
      pingInterval: config.pingInterval || 30000,
      enablePresence: config.enablePresence ?? true,
      enableTypingIndicators: config.enableTypingIndicators ?? true,
    };
  }

  // Connection management
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectCount = 0;
          this.startPing();
          console.log('WebSocket connected');
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onclose = (event) => {
          this.handleDisconnection(event.code, event.reason);
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        // Set up authentication success handler
        const authHandler = (data: any) => {
          if (data.success) {
            this.isAuthenticated = true;
            this.off(WSEventType.AUTHENTICATE, authHandler);
            if (this.connectHandler) this.connectHandler();
            resolve();
          } else {
            reject(new Error('Authentication failed'));
          }
        };
        
        this.on(WSEventType.AUTHENTICATE, authHandler);
        
        // Set up connection handler to authenticate
        const connectHandler = () => {
          this.authenticate();
          this.off(WSEventType.CONNECT, connectHandler);
        };
        
        this.on(WSEventType.CONNECT, connectHandler);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
  }

  // Authentication
  private authenticate(): void {
    const authData: WSAuthData = {
      token: this.config.token,
      workspaceIds: this.config.workspaceIds,
    };
    
    this.sendMessage({
      type: WSEventType.AUTHENTICATE,
      data: authData,
      timestamp: new Date().toISOString(),
    });
  }

  // Message handling
  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data);
      
      if (message.type === WSEventType.PONG) {
        this.lastPong = Date.now();
        return;
      }
      
      if (message.type === WSEventType.ERROR) {
        if (this.errorHandler) {
          this.errorHandler(message.data as WSErrorData);
        } else {
          console.error('WebSocket error:', message.data);
        }
        return;
      }
      
      // Execute registered handlers
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data, message);
          } catch (error) {
            console.error('Error in event handler:', error);
          }
        });
      }
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Connection management
  private handleDisconnection(code: number, reason: string): void {
    this.isConnected = false;
    this.isAuthenticated = false;
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    
    console.log(`WebSocket disconnected: ${code} ${reason}`);
    
    if (this.disconnectHandler) {
      this.disconnectHandler();
    }
    
    // Attempt reconnection
    if (this.reconnectCount < this.config.reconnectAttempts) {
      this.reconnectCount++;
      console.log(`Attempting reconnection ${this.reconnectCount}/${this.config.reconnectAttempts}`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.config.reconnectDelay) as any;
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Ping/Pong
  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.isConnected && this.isAuthenticated) {
        this.sendMessage({
          type: WSEventType.PING,
          data: {},
          timestamp: new Date().toISOString(),
        });
        
        // Check if pong was received within reasonable time
        setTimeout(() => {
          if (Date.now() - this.lastPong > this.config.pingInterval * 2) {
            console.warn('Ping timeout, connection may be stale');
          }
        }, 5000);
      }
    }, this.config.pingInterval) as any;
  }

  // Message sending
  private sendMessage(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  // Event handling
  public on<T = any>(eventType: WSEventType, handler: WSEventHandler<T>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  public off<T = any>(eventType: WSEventType, handler: WSEventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public onError(handler: WSErrorHandler): void {
    this.errorHandler = handler;
  }

  public onConnect(handler: WSConnectionHandler): void {
    this.connectHandler = handler;
  }

  public onDisconnect(handler: WSConnectionHandler): void {
    this.disconnectHandler = handler;
  }

  // Presence management
  public updatePresence(workspaceId: string, status: 'online' | 'away' | 'offline', currentTask?: string): void {
    if (!this.config.enablePresence || !this.isAuthenticated) return;
    
    const presenceData: WSPresenceData = {
      userId: '', // Will be set by server
      workspaceId,
      status,
      lastSeen: new Date().toISOString(),
      currentTask,
    };
    
    this.sendMessage({
      type: WSEventType.USER_PRESENCE,
      data: presenceData,
      timestamp: new Date().toISOString(),
      workspaceId,
    });
  }

  // Typing indicators
  public sendTypingIndicator(workspaceId: string, isTyping: boolean, taskId?: string): void {
    if (!this.config.enableTypingIndicators || !this.isAuthenticated) return;
    
    const typingData: WSTypingData = {
      userId: '', // Will be set by server
      workspaceId,
      taskId,
      isTyping,
    };
    
    this.sendMessage({
      type: WSEventType.USER_TYPING,
      data: typingData,
      timestamp: new Date().toISOString(),
      workspaceId,
    });
  }

  // Data synchronization
  public requestSync(workspaceId: string, lastSyncTimestamp?: string): void {
    if (!this.isAuthenticated) return;
    
    const syncRequest: WSSyncRequest = {
      workspaceId,
      lastSyncTimestamp,
      entities: ['tasks', 'workspaces'],
    };
    
    this.sendMessage({
      type: WSEventType.SYNC_REQUEST,
      data: syncRequest,
      timestamp: new Date().toISOString(),
      workspaceId,
    });
  }

  // Convenience methods for common events
  public onTaskCreated(handler: WSEventHandler<WSTaskData>): void {
    this.on(WSEventType.TASK_CREATED, handler);
  }

  public onTaskUpdated(handler: WSEventHandler<WSTaskData>): void {
    this.on(WSEventType.TASK_UPDATED, handler);
  }

  public onTaskDeleted(handler: WSEventHandler<WSTaskData>): void {
    this.on(WSEventType.TASK_DELETED, handler);
  }

  public onTaskCompleted(handler: WSEventHandler<WSTaskData>): void {
    this.on(WSEventType.TASK_COMPLETED, handler);
  }

  public onTaskMoved(handler: WSEventHandler<WSTaskData>): void {
    this.on(WSEventType.TASK_MOVED, handler);
  }

  public onWorkspaceCreated(handler: WSEventHandler<WSWorkspaceData>): void {
    this.on(WSEventType.WORKSPACE_CREATED, handler);
  }

  public onWorkspaceUpdated(handler: WSEventHandler<WSWorkspaceData>): void {
    this.on(WSEventType.WORKSPACE_UPDATED, handler);
  }

  public onWorkspaceDeleted(handler: WSEventHandler<WSWorkspaceData>): void {
    this.on(WSEventType.WORKSPACE_DELETED, handler);
  }

  public onUserPresence(handler: WSEventHandler<WSPresenceData>): void {
    this.on(WSEventType.USER_PRESENCE, handler);
  }

  public onUserTyping(handler: WSEventHandler<WSTypingData>): void {
    this.on(WSEventType.USER_TYPING, handler);
  }

  public onSyncResponse(handler: WSEventHandler<WSSyncResponse>): void {
    this.on(WSEventType.SYNC_RESPONSE, handler);
  }

  // Status getters
  public get connected(): boolean {
    return this.isConnected;
  }

  public get authenticated(): boolean {
    return this.isAuthenticated;
  }

  public get workspaceIds(): string[] {
    return this.config.workspaceIds;
  }

  // Update configuration
  public updateToken(token: string): void {
    this.config.token = token;
    if (this.isConnected && !this.isAuthenticated) {
      this.authenticate();
    }
  }

  public updateWorkspaces(workspaceIds: string[]): void {
    this.config.workspaceIds = workspaceIds;
    if (this.isAuthenticated) {
      // Re-authenticate with new workspace IDs
      this.authenticate();
    }
  }
}

// Example usage:
/*
const wsClient = new TodoWebSocketClient({
  url: 'ws://localhost:3001/api/v1/ws',
  token: 'your-jwt-token',
  workspaceIds: ['workspace-1', 'workspace-2'],
});

// Set up event handlers
wsClient.onTaskCreated((data) => {
  console.log('Task created:', data.task);
});

wsClient.onTaskUpdated((data) => {
  console.log('Task updated:', data.task);
});

wsClient.onUserPresence((data) => {
  console.log('User presence:', data);
});

wsClient.onError((error) => {
  console.error('WebSocket error:', error);
});

// Connect
await wsClient.connect();

// Update presence
wsClient.updatePresence('workspace-1', 'online');

// Send typing indicator
wsClient.sendTypingIndicator('workspace-1', true, 'task-123');

// Request sync
wsClient.requestSync('workspace-1');

// Disconnect
wsClient.disconnect();
*/

export default TodoWebSocketClient;