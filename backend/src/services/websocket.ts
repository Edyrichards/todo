import { FastifyInstance } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { verifyJWT } from './auth.js';
import { redis } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import {
  AuthenticatedWebSocket,
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
  WSRoom,
  WSServerConfig,
  WSConnectionStats,
  WSEventHandler,
} from '../types/websocket.js';

export class WebSocketService {
  private fastify: FastifyInstance;
  private rooms: Map<string, WSRoom> = new Map();
  private connections: Set<AuthenticatedWebSocket> = new Set();
  private eventHandlers: Map<WSEventType, WSEventHandler[]> = new Map();
  private config: WSServerConfig;
  private stats: WSConnectionStats;
  private pingInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(fastify: FastifyInstance, config?: Partial<WSServerConfig>) {
    this.fastify = fastify;
    this.config = {
      pingInterval: 30000, // 30 seconds
      connectionTimeout: 60000, // 1 minute
      maxConnections: 10000,
      heartbeatInterval: 5000, // 5 seconds
      enablePresence: true,
      enableTypingIndicators: true,
      enableCursorPositions: true,
      ...config,
    };

    this.stats = {
      totalConnections: 0,
      authenticatedConnections: 0,
      activeRooms: 0,
      messagesPerSecond: 0,
      lastActivity: new Date(),
    };

    this.setupEventHandlers();
    this.startHeartbeat();
    this.startCleanup();
  }

  // Initialize WebSocket handling
  public async handleConnection(connection: SocketStream): Promise<void> {
    const ws = connection.socket as AuthenticatedWebSocket;
    
    // Initialize connection properties
    ws.isAuthenticated = false;
    ws.lastPing = Date.now();
    
    this.connections.add(ws);
    this.stats.totalConnections++;
    
    logger.info('New WebSocket connection established', {
      totalConnections: this.connections.size,
    });

    // Set up connection event handlers
    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        logger.error('Error parsing WebSocket message', { error });
        this.sendError(ws, 'PARSE_ERROR', 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', { error });
      this.handleDisconnection(ws);
    });

    // Send welcome message
    this.sendMessage(ws, {
      type: WSEventType.CONNECT,
      data: { message: 'Connected to Todo WebSocket server' },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle incoming messages
  private async handleMessage(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void> {
    this.stats.lastActivity = new Date();
    
    logger.debug('Received WebSocket message', {
      type: message.type,
      userId: ws.userId,
      workspaceId: message.workspaceId,
    });

    try {
      switch (message.type) {
        case WSEventType.AUTHENTICATE:
          await this.handleAuthentication(ws, message.data as WSAuthData);
          break;
          
        case WSEventType.PING:
          this.handlePing(ws);
          break;
          
        case WSEventType.USER_PRESENCE:
          await this.handlePresence(ws, message.data as WSPresenceData);
          break;
          
        case WSEventType.USER_TYPING:
          await this.handleTyping(ws, message.data as WSTypingData);
          break;
          
        case WSEventType.SYNC_REQUEST:
          await this.handleSyncRequest(ws, message.data as WSSyncRequest);
          break;
          
        default:
          // Delegate to registered event handlers
          await this.executeEventHandlers(message.type, ws, message.data, message);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message', {
        type: message.type,
        error,
        userId: ws.userId,
      });
      this.sendError(ws, 'MESSAGE_ERROR', 'Error processing message');
    }
  }

  // Authentication handling
  private async handleAuthentication(ws: AuthenticatedWebSocket, data: WSAuthData): Promise<void> {
    try {
      const decoded = await verifyJWT(data.token);
      
      ws.userId = decoded.userId;
      ws.workspaceIds = data.workspaceIds || [];
      ws.isAuthenticated = true;
      
      this.stats.authenticatedConnections++;
      
      // Join workspace rooms
      for (const workspaceId of ws.workspaceIds) {
        this.joinRoom(ws, workspaceId);
      }
      
      // Set user presence
      if (this.config.enablePresence) {
        await this.updatePresence(ws.userId, ws.workspaceIds, 'online');
      }
      
      logger.info('WebSocket authenticated', {
        userId: ws.userId,
        workspaceIds: ws.workspaceIds,
      });
      
      this.sendMessage(ws, {
        type: WSEventType.AUTHENTICATE,
        data: { success: true, userId: ws.userId },
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      logger.error('WebSocket authentication failed', { error });
      this.sendError(ws, 'AUTH_ERROR', 'Authentication failed');
      ws.close();
    }
  }

  // Ping/Pong handling
  private handlePing(ws: AuthenticatedWebSocket): void {
    ws.lastPing = Date.now();
    this.sendMessage(ws, {
      type: WSEventType.PONG,
      data: { timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }

  // Presence handling
  private async handlePresence(ws: AuthenticatedWebSocket, data: WSPresenceData): Promise<void> {
    if (!this.config.enablePresence || !ws.isAuthenticated) return;
    
    await this.updatePresence(data.userId, [data.workspaceId], data.status);
    
    // Broadcast presence update to workspace members
    this.broadcastToRoom(data.workspaceId, {
      type: WSEventType.USER_PRESENCE,
      data,
      timestamp: new Date().toISOString(),
    }, ws);
  }

  // Typing indicator handling
  private async handleTyping(ws: AuthenticatedWebSocket, data: WSTypingData): Promise<void> {
    if (!this.config.enableTypingIndicators || !ws.isAuthenticated) return;
    
    // Broadcast typing indicator to workspace members
    this.broadcastToRoom(data.workspaceId, {
      type: WSEventType.USER_TYPING,
      data,
      timestamp: new Date().toISOString(),
    }, ws);
  }

  // Sync request handling
  private async handleSyncRequest(ws: AuthenticatedWebSocket, data: WSSyncRequest): Promise<void> {
    if (!ws.isAuthenticated) {
      this.sendError(ws, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    try {
      // TODO: Implement actual sync logic with database
      const syncResponse: WSSyncResponse = {
        workspaceId: data.workspaceId,
        timestamp: new Date().toISOString(),
        tasks: [], // TODO: Fetch tasks from database
        workspaces: [], // TODO: Fetch workspaces from database
        deletedTasks: [],
        deletedWorkspaces: [],
      };

      this.sendMessage(ws, {
        type: WSEventType.SYNC_RESPONSE,
        data: syncResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error handling sync request', { error, userId: ws.userId });
      this.sendError(ws, 'SYNC_ERROR', 'Failed to sync data');
    }
  }

  // Connection cleanup
  private handleDisconnection(ws: AuthenticatedWebSocket): void {
    this.connections.delete(ws);
    
    if (ws.isAuthenticated) {
      this.stats.authenticatedConnections--;
      
      // Leave all rooms
      if (ws.workspaceIds) {
        for (const workspaceId of ws.workspaceIds) {
          this.leaveRoom(ws, workspaceId);
        }
      }
      
      // Update presence to offline
      if (this.config.enablePresence && ws.userId && ws.workspaceIds) {
        this.updatePresence(ws.userId, ws.workspaceIds, 'offline').catch((error) => {
          logger.error('Error updating presence on disconnect', { error });
        });
      }
    }
    
    logger.info('WebSocket disconnected', {
      userId: ws.userId,
      totalConnections: this.connections.size,
    });
  }

  // Room management
  private joinRoom(ws: AuthenticatedWebSocket, workspaceId: string): void {
    let room = this.rooms.get(workspaceId);
    if (!room) {
      room = {
        workspaceId,
        connections: new Set(),
        lastActivity: new Date(),
      };
      this.rooms.set(workspaceId, room);
      this.stats.activeRooms++;
    }
    
    room.connections.add(ws);
    room.lastActivity = new Date();
    
    logger.debug('User joined room', {
      userId: ws.userId,
      workspaceId,
      roomSize: room.connections.size,
    });
  }

  private leaveRoom(ws: AuthenticatedWebSocket, workspaceId: string): void {
    const room = this.rooms.get(workspaceId);
    if (!room) return;
    
    room.connections.delete(ws);
    
    if (room.connections.size === 0) {
      this.rooms.delete(workspaceId);
      this.stats.activeRooms--;
    }
    
    logger.debug('User left room', {
      userId: ws.userId,
      workspaceId,
      roomSize: room.connections.size,
    });
  }

  // Broadcasting
  public broadcastToRoom(workspaceId: string, message: WSMessage, exclude?: AuthenticatedWebSocket): void {
    const room = this.rooms.get(workspaceId);
    if (!room) return;
    
    room.lastActivity = new Date();
    
    for (const ws of room.connections) {
      if (ws !== exclude && ws.isAuthenticated) {
        this.sendMessage(ws, message);
      }
    }
  }

  public broadcastToUser(userId: string, message: WSMessage): void {
    for (const ws of this.connections) {
      if (ws.userId === userId && ws.isAuthenticated) {
        this.sendMessage(ws, message);
      }
    }
  }

  // Message sending
  private sendMessage(ws: AuthenticatedWebSocket, message: WSMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: AuthenticatedWebSocket, code: string, message: string): void {
    this.sendMessage(ws, {
      type: WSEventType.ERROR,
      data: { code, message } as WSErrorData,
      timestamp: new Date().toISOString(),
    });
  }

  // Event handler registration
  public on(eventType: WSEventType, handler: WSEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  private async executeEventHandlers(
    eventType: WSEventType,
    ws: AuthenticatedWebSocket,
    data: any,
    message: WSMessage
  ): Promise<void> {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;
    
    for (const handler of handlers) {
      try {
        await handler(ws, data, message);
      } catch (error) {
        logger.error('Error executing event handler', {
          eventType,
          error,
          userId: ws.userId,
        });
      }
    }
  }

  // Public API for broadcasting events
  public async broadcastTaskEvent(eventType: WSEventType, data: WSTaskData): Promise<void> {
    this.broadcastToRoom(data.workspaceId, {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      workspaceId: data.workspaceId,
    });
    
    // Store in Redis for offline users
    await this.storeEventForOfflineUsers(data.workspaceId, eventType, data);
  }

  public async broadcastWorkspaceEvent(eventType: WSEventType, data: WSWorkspaceData): Promise<void> {
    this.broadcastToRoom(data.workspace.id, {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      workspaceId: data.workspace.id,
    });
    
    // Store in Redis for offline users
    await this.storeEventForOfflineUsers(data.workspace.id, eventType, data);
  }

  // Presence management
  private async updatePresence(userId: string, workspaceIds: string[], status: 'online' | 'away' | 'offline'): Promise<void> {
    try {
      for (const workspaceId of workspaceIds) {
        const presenceKey = `presence:${workspaceId}:${userId}`;
        const presenceData = {
          userId,
          workspaceId,
          status,
          lastSeen: new Date().toISOString(),
        };
        
        if (status === 'offline') {
          await redis.del(presenceKey);
        } else {
          await redis.setex(presenceKey, 300, JSON.stringify(presenceData)); // 5 minutes TTL
        }
        
        // Publish presence update
        await redis.publish(`presence:${workspaceId}`, JSON.stringify(presenceData));
      }
    } catch (error) {
      logger.error('Error updating presence', { error, userId, workspaceIds });
    }
  }

  // Store events for offline users
  private async storeEventForOfflineUsers(workspaceId: string, eventType: WSEventType, data: any): Promise<void> {
    try {
      const eventData = {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        workspaceId,
      };
      
      // Store in Redis list for offline sync
      await redis.lpush(`offline_events:${workspaceId}`, JSON.stringify(eventData));
      await redis.ltrim(`offline_events:${workspaceId}`, 0, 999); // Keep last 1000 events
      await redis.expire(`offline_events:${workspaceId}`, 86400 * 7); // 7 days TTL
    } catch (error) {
      logger.error('Error storing offline event', { error, workspaceId, eventType });
    }
  }

  // Setup default event handlers
  private setupEventHandlers(): void {
    // Task event handlers will be registered by task service
    // Workspace event handlers will be registered by workspace service
  }

  // Heartbeat to check connection health
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const staleConnections: AuthenticatedWebSocket[] = [];
      
      for (const ws of this.connections) {
        if (ws.isAuthenticated && ws.lastPing && (now - ws.lastPing) > this.config.connectionTimeout) {
          staleConnections.push(ws);
        }
      }
      
      // Close stale connections
      for (const ws of staleConnections) {
        logger.warn('Closing stale WebSocket connection', { userId: ws.userId });
        ws.close();
      }
      
    }, this.config.heartbeatInterval);
  }

  // Cleanup inactive rooms
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const inactiveRooms: string[] = [];
      
      for (const [workspaceId, room] of this.rooms) {
        if (room.connections.size === 0 || (now - room.lastActivity.getTime()) > 3600000) { // 1 hour
          inactiveRooms.push(workspaceId);
        }
      }
      
      for (const workspaceId of inactiveRooms) {
        this.rooms.delete(workspaceId);
        this.stats.activeRooms--;
      }
      
    }, 600000); // 10 minutes
  }

  // Get connection statistics
  public getStats(): WSConnectionStats {
    return {
      ...this.stats,
      totalConnections: this.connections.size,
      activeRooms: this.rooms.size,
    };
  }

  // Shutdown cleanup
  public async shutdown(): Promise<void> {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    
    // Close all connections
    for (const ws of this.connections) {
      ws.close();
    }
    
    this.connections.clear();
    this.rooms.clear();
    
    logger.info('WebSocket service shutdown complete');
  }
}

// Export singleton instance
let wsService: WebSocketService | null = null;

export const initializeWebSocketService = (fastify: FastifyInstance, config?: Partial<WSServerConfig>): WebSocketService => {
  if (!wsService) {
    wsService = new WebSocketService(fastify, config);
  }
  return wsService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
};