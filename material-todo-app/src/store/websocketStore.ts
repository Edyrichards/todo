/**
 * WebSocket Store for Real-time Todo App
 * 
 * Manages WebSocket connection, real-time events, and integration with the main Todo store.
 * Provides user presence, typing indicators, and live synchronization.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useEffect } from 'react';
import TodoWebSocketClient from '../services/websocket-client';
import {
  WSConnectionState,
  WSTaskData,
  WSWorkspaceData,
  WSPresenceData,
  WSTypingData,
  WSErrorData,
  UserPresence,
} from '../../shared/websocket-types';
import { Task } from '../../shared/types';
import { toast } from 'sonner';

// Environment configuration
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/api/v1/ws';
const DEFAULT_WORKSPACE_ID = 'default-workspace'; // For demo purposes

interface TypingUser {
  userId: string;
  userName?: string;
  taskId?: string;
  timestamp: Date;
}

interface WebSocketStore {
  // Connection state
  client: TodoWebSocketClient | null;
  connectionState: WSConnectionState;
  isInitialized: boolean;
  
  // Real-time data
  userPresence: Map<string, UserPresence>;
  typingUsers: TypingUser[];
  lastSyncTimestamp?: string;
  
  // Actions
  initialize: (token?: string, workspaceIds?: string[]) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Real-time updates
  sendPresenceUpdate: (status: 'online' | 'away' | 'offline', currentTask?: string) => void;
  sendTypingIndicator: (isTyping: boolean, taskId?: string) => void;
  requestSync: (workspaceId?: string) => void;
  
  // Event handlers (these will be called by the main store)
  onTaskEvent: (eventType: 'created' | 'updated' | 'deleted' | 'completed', task: Task) => void;
  
  // Internal event handlers
  handleTaskCreated: (data: WSTaskData) => void;
  handleTaskUpdated: (data: WSTaskData) => void;
  handleTaskDeleted: (data: WSTaskData) => void;
  handleUserPresence: (data: WSPresenceData) => void;
  handleUserTyping: (data: WSTypingData) => void;
  handleError: (error: WSErrorData) => void;
  
  // State management
  setConnectionState: (state: WSConnectionState) => void;
  getUserPresence: (userId: string) => UserPresence | undefined;
  getTypingUsers: (taskId?: string) => TypingUser[];
  cleanupTypingUsers: () => void;
}

// Create the WebSocket store
export const useWebSocketStore = create<WebSocketStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  client: null,
  connectionState: {
    status: 'disconnected',
    reconnectAttempts: 0,
  },
  isInitialized: false,
  userPresence: new Map(),
  typingUsers: [],
  lastSyncTimestamp: undefined,

  // Initialize WebSocket connection
  initialize: async (token?: string, workspaceIds: string[] = [DEFAULT_WORKSPACE_ID]) => {
    const { client } = get();
    
    if (client) {
      console.log('WebSocket client already initialized');
      return;
    }

    const newClient = new TodoWebSocketClient({
      url: WS_URL,
      token,
      workspaceIds,
      reconnectAttempts: 5,
      reconnectDelay: 5000,
      enablePresence: true,
      enableTypingIndicators: true,
    });

    // Set up event handlers
    const store = get();
    
    newClient.onStateChange((state) => {
      store.setConnectionState(state);
    });

    newClient.onTaskCreated((data) => {
      store.handleTaskCreated(data);
    });

    newClient.onTaskUpdated((data) => {
      store.handleTaskUpdated(data);
    });

    newClient.onTaskDeleted((data) => {
      store.handleTaskDeleted(data);
    });

    newClient.onUserPresence((data) => {
      store.handleUserPresence(data);
    });

    newClient.onUserTyping((data) => {
      store.handleUserTyping(data);
    });

    newClient.onError((error) => {
      store.handleError(error);
    });

    newClient.onConnect(() => {
      console.log('WebSocket connected successfully');
      toast.success('Connected to real-time updates');
      
      // Send initial presence
      store.sendPresenceUpdate('online');
      
      // Request initial sync
      workspaceIds.forEach(workspaceId => {
        store.requestSync(workspaceId);
      });
    });

    newClient.onDisconnect(() => {
      console.log('WebSocket disconnected');
      toast.info('Disconnected from real-time updates');
    });

    // Set the client and attempt connection
    set({ client: newClient, isInitialized: true });

    try {
      await newClient.connect();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      toast.error('Failed to connect to real-time updates');
    }
  },

  // Disconnect WebSocket
  disconnect: () => {
    const { client } = get();
    if (client) {
      client.disconnect();
      set({ 
        client: null, 
        isInitialized: false,
        userPresence: new Map(),
        typingUsers: [],
      });
    }
  },

  // Manual reconnection
  reconnect: async () => {
    const { client } = get();
    if (client) {
      try {
        await client.reconnect();
        toast.success('Reconnected to real-time updates');
      } catch (error) {
        console.error('Failed to reconnect:', error);
        toast.error('Failed to reconnect to real-time updates');
      }
    }
  },

  // Send presence update
  sendPresenceUpdate: (status, currentTask) => {
    const { client } = get();
    if (client && client.authenticated) {
      client.workspaceIds.forEach(workspaceId => {
        client.updatePresence(workspaceId, status, currentTask);
      });
    }
  },

  // Send typing indicator
  sendTypingIndicator: (isTyping, taskId) => {
    const { client } = get();
    if (client && client.authenticated) {
      client.workspaceIds.forEach(workspaceId => {
        client.sendTypingIndicator(workspaceId, isTyping, taskId);
      });
    }
  },

  // Request data synchronization
  requestSync: (workspaceId = DEFAULT_WORKSPACE_ID) => {
    const { client, lastSyncTimestamp } = get();
    if (client && client.authenticated) {
      client.requestSync(workspaceId, lastSyncTimestamp);
    }
  },

  // Handle outgoing task events (called by main store)
  onTaskEvent: (eventType, task) => {
    const { client } = get();
    if (!client || !client.authenticated) return;

    // This would typically send the event to the server
    // For now, we'll just log it since the actual API integration
    // would handle this in the HTTP layer
    console.log(`Task ${eventType}:`, task);
  },

  // Event handlers for incoming WebSocket events
  handleTaskCreated: (data) => {
    console.log('Task created via WebSocket:', data.task);
    
    // Import the main store and update it
    // Note: This creates a circular dependency which we'll handle carefully
    import('./todoStore').then(({ useTodoStore }) => {
      const { addTask } = useTodoStore.getState();
      addTask(data.task);
    });
    
    toast.success(`New task created: ${data.task.title}`);
  },

  handleTaskUpdated: (data) => {
    console.log('Task updated via WebSocket:', data.task);
    
    import('./todoStore').then(({ useTodoStore }) => {
      const { updateTask } = useTodoStore.getState();
      updateTask(data.task.id, data.task);
    });
    
    toast.info(`Task updated: ${data.task.title}`);
  },

  handleTaskDeleted: (data) => {
    console.log('Task deleted via WebSocket:', data.task);
    
    import('./todoStore').then(({ useTodoStore }) => {
      const { deleteTask } = useTodoStore.getState();
      deleteTask(data.task.id);
    });
    
    toast.info(`Task deleted: ${data.task.title}`);
  },

  handleUserPresence: (data) => {
    console.log('User presence update:', data);
    
    set((state) => {
      const newPresence = new Map(state.userPresence);
      newPresence.set(data.userId, {
        userId: data.userId,
        status: data.status,
        lastSeen: new Date(data.lastSeen),
        currentTask: data.currentTask,
      });
      return { userPresence: newPresence };
    });
  },

  handleUserTyping: (data) => {
    console.log('User typing update:', data);
    
    set((state) => {
      const newTypingUsers = state.typingUsers.filter(
        user => user.userId !== data.userId || user.taskId !== data.taskId
      );
      
      if (data.isTyping) {
        newTypingUsers.push({
          userId: data.userId,
          userName: `User ${data.userId}`, // TODO: Get actual user name
          taskId: data.taskId,
          timestamp: new Date(),
        });
      }
      
      return { typingUsers: newTypingUsers };
    });
  },

  handleError: (error) => {
    console.error('WebSocket error:', error);
    toast.error(`Real-time error: ${error.message}`);
  },

  // State management
  setConnectionState: (connectionState) => {
    set({ connectionState });
  },

  getUserPresence: (userId) => {
    const { userPresence } = get();
    return userPresence.get(userId);
  },

  getTypingUsers: (taskId) => {
    const { typingUsers } = get();
    if (taskId) {
      return typingUsers.filter(user => user.taskId === taskId);
    }
    return typingUsers;
  },

  cleanupTypingUsers: () => {
    const now = new Date();
    const TYPING_TIMEOUT = 5000; // 5 seconds
    
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        user => now.getTime() - user.timestamp.getTime() < TYPING_TIMEOUT
      ),
    }));
  },
})));

// Helper hook for connection status
export const useWebSocketConnection = () => {
  const connectionState = useWebSocketStore(state => state.connectionState);
  const isInitialized = useWebSocketStore(state => state.isInitialized);
  const reconnect = useWebSocketStore(state => state.reconnect);
  
  return {
    connectionState,
    isInitialized,
    isConnected: connectionState.status === 'connected' || connectionState.status === 'authenticated',
    isAuthenticated: connectionState.status === 'authenticated',
    reconnect,
  };
};

// Helper hook for user presence
export const useUserPresence = () => {
  const userPresence = useWebSocketStore(state => state.userPresence);
  const sendPresenceUpdate = useWebSocketStore(state => state.sendPresenceUpdate);
  const getUserPresence = useWebSocketStore(state => state.getUserPresence);
  
  return {
    userPresence: Array.from(userPresence.values()),
    sendPresenceUpdate,
    getUserPresence,
  };
};

// Helper hook for typing indicators
export const useTypingIndicators = (taskId?: string) => {
  const typingUsers = useWebSocketStore(state => state.getTypingUsers(taskId));
  const sendTypingIndicator = useWebSocketStore(state => state.sendTypingIndicator);
  const cleanupTypingUsers = useWebSocketStore(state => state.cleanupTypingUsers);
  
  // Cleanup typing users periodically
  useEffect(() => {
    const interval = setInterval(cleanupTypingUsers, 1000);
    return () => clearInterval(interval);
  }, [cleanupTypingUsers]);
  
  return {
    typingUsers,
    sendTypingIndicator,
  };
};

// Auto-initialize WebSocket when store is first used
// This will be called by the main app
export const initializeWebSocket = async (token?: string, workspaceIds?: string[]) => {
  const { initialize, isInitialized } = useWebSocketStore.getState();
  
  if (!isInitialized) {
    await initialize(token, workspaceIds);
  }
};

// Cleanup function for app shutdown
export const cleanupWebSocket = () => {
  const { disconnect } = useWebSocketStore.getState();
  disconnect();
};