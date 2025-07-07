/**
 * WebSocket Client for Todo App Frontend
 * 
 * Provides real-time communication between the React frontend and the Node.js backend.
 * Handles connection management, authentication, and event broadcasting.
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
  WSConnectionState,
  WSEventHandler,
  WSErrorHandler,
  WSConnectionHandler,
  WSClientConfig,
} from '../../shared/websocket-types';

export class TodoWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WSClientConfig>;
  private connectionState: WSConnectionState;
  private reconnectTimer?: number;
  private pingTimer?: number;
  private lastPong = 0;
  
  // Event handlers
  private eventHandlers = new Map<WSEventType, WSEventHandler[]>();
  private errorHandler?: WSErrorHandler;
  private connectHandler?: WSConnectionHandler;
  private disconnectHandler?: WSConnectionHandler;
  private stateChangeHandler?: (state: WSConnectionState) => void;

  constructor(config: WSClientConfig) {
    this.config = {
      url: config.url,
      token: config.token || '',
      workspaceIds: config.workspaceIds || [],
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 5000,
      pingInterval: config.pingInterval ?? 30000,
      enablePresence: config.enablePresence ?? true,
      enableTypingIndicators: config.enableTypingIndicators ?? true,
    };

    this.connectionState = {
      status: 'disconnected',
      reconnectAttempts: 0,
    };
  }

  // Connection management
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState.status === 'connected' || this.connectionState.status === 'connecting') {
        resolve();
        return;
      }

      this.updateConnectionState({ status: 'connecting' });

      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          this.updateConnectionState({ 
            status: 'connected',
            lastConnected: new Date(),
            reconnectAttempts: 0,
            error: undefined,
          });
          this.startPing();
          console.log('WebSocket connected');
        };
        
        this.ws.onmessage = (event: any) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onclose = (event: any) => {
          this.handleDisconnection(event.code, event.reason);
        };
        
        this.ws.onerror = (error: any) => {
          console.error('WebSocket error:', error);
          this.updateConnectionState({ 
            status: 'error',
            error: 'Connection failed',
          });
          reject(error);
        };

        // Set up authentication success handler
        const authHandler = (data: any) => {
          if (data.success) {
            this.updateConnectionState({ status: 'authenticated' });
            this.off(WSEventType.AUTHENTICATE, authHandler);
            if (this.connectHandler) this.connectHandler();
            resolve();
          } else {
            this.updateConnectionState({ 
              status: 'error',
              error: 'Authentication failed',
            });
            reject(new Error('Authentication failed'));
          }
        };
        
        this.on(WSEventType.AUTHENTICATE, authHandler);
        
        // Set up connection handler to authenticate
        const connectHandler = () => {
          if (this.config.token) {
            this.authenticate();
          } else {
            // No token provided, resolve anyway for non-authenticated usage
            resolve();
          }
          this.off(WSEventType.CONNECT, connectHandler);
        };
        
        this.on(WSEventType.CONNECT, connectHandler);
        
      } catch (error) {
        this.updateConnectionState({ 
          status: 'error',
          error: 'Failed to create WebSocket connection',
        });
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
    
    this.updateConnectionState({ status: 'disconnected' });
  }

  // Authentication
  private authenticate(): void {
    if (!this.config.token) {
      console.warn('No token provided for WebSocket authentication');
      return;
    }

    this.updateConnectionState({ status: 'authenticating' });

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
    this.updateConnectionState({ status: 'disconnected' });
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    
    console.log(`WebSocket disconnected: ${code} ${reason}`);
    
    if (this.disconnectHandler) {
      this.disconnectHandler();
    }
    
    // Attempt reconnection
    if (this.connectionState.reconnectAttempts < this.config.reconnectAttempts) {
      const attempts = this.connectionState.reconnectAttempts + 1;
      this.updateConnectionState({ reconnectAttempts: attempts });
      
      console.log(`Attempting reconnection ${attempts}/${this.config.reconnectAttempts}`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.config.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.updateConnectionState({ 
        status: 'error',
        error: 'Failed to reconnect after maximum attempts',
      });
    }
  }

  // Ping/Pong
  private startPing(): void {
    this.pingTimer = window.setInterval(() => {
      if (this.connectionState.status === 'connected' || this.connectionState.status === 'authenticated') {
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
    }, this.config.pingInterval);
  }

  // Message sending
  private sendMessage(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  // State management
  private updateConnectionState(updates: Partial<WSConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    if (this.stateChangeHandler) {
      this.stateChangeHandler(this.connectionState);
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

  public onStateChange(handler: (state: WSConnectionState) => void): void {
    this.stateChangeHandler = handler;
  }

  // Presence management
  public updatePresence(workspaceId: string, status: 'online' | 'away' | 'offline', currentTask?: string): void {
    if (!this.config.enablePresence || this.connectionState.status !== 'authenticated') return;
    
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
    if (!this.config.enableTypingIndicators || this.connectionState.status !== 'authenticated') return;
    
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
    if (this.connectionState.status !== 'authenticated') return;
    
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
    return this.connectionState.status === 'connected' || this.connectionState.status === 'authenticated';
  }

  public get authenticated(): boolean {
    return this.connectionState.status === 'authenticated';
  }

  public get connectionStatus(): WSConnectionState {
    return { ...this.connectionState };
  }

  public get workspaceIds(): string[] {
    return [...this.config.workspaceIds];
  }

  // Update configuration
  public updateToken(token: string): void {
    this.config.token = token;
    if (this.connected && !this.authenticated) {
      this.authenticate();
    }
  }

  public updateWorkspaces(workspaceIds: string[]): void {
    this.config.workspaceIds = [...workspaceIds];
    if (this.authenticated) {
      // Re-authenticate with new workspace IDs
      this.authenticate();
    }
  }

  // Manual reconnection
  public reconnect(): Promise<void> {
    this.disconnect();
    this.updateConnectionState({ reconnectAttempts: 0 });
    return this.connect();
  }
}

export default TodoWebSocketClient;