import { FastifyInstance } from 'fastify';
import { getWebSocketService } from '../services/websocket.js';
import { WSEventType, WSTaskData, WSWorkspaceData } from '../types/websocket.js';
import { Task, Workspace } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * WebSocket event handlers for real-time updates
 * These handlers are called by controllers when data changes occur
 */

export class WebSocketEventHandlers {
  private wsService = getWebSocketService();

  // Task event handlers
  public async handleTaskCreated(task: Task, workspaceId: string, userId: string): Promise<void> {
    try {
      const data: WSTaskData = {
        task,
        workspaceId,
        userId,
      };
      
      await this.wsService.broadcastTaskEvent(WSEventType.TASK_CREATED, data);
      
      logger.info('Broadcasted task created event', {
        taskId: task.id,
        workspaceId,
        userId,
      });
    } catch (error) {
      logger.error('Error broadcasting task created event', {
        error,
        taskId: task.id,
        workspaceId,
        userId,
      });
    }
  }

  public async handleTaskUpdated(
    task: Task,
    workspaceId: string,
    userId: string,
    previousVersion?: Partial<Task>
  ): Promise<void> {
    try {
      const data: WSTaskData = {
        task,
        workspaceId,
        userId,
        previousVersion,
      };
      
      await this.wsService.broadcastTaskEvent(WSEventType.TASK_UPDATED, data);
      
      logger.info('Broadcasted task updated event', {
        taskId: task.id,
        workspaceId,
        userId,
      });
    } catch (error) {
      logger.error('Error broadcasting task updated event', {
        error,
        taskId: task.id,
        workspaceId,
        userId,
      });
    }
  }

  public async handleTaskDeleted(task: Task, workspaceId: string, userId: string): Promise<void> {
    try {
      const data: WSTaskData = {
        task,
        workspaceId,
        userId,
      };
      
      await this.wsService.broadcastTaskEvent(WSEventType.TASK_DELETED, data);
      
      logger.info('Broadcasted task deleted event', {
        taskId: task.id,
        workspaceId,
        userId,
      });
    } catch (error) {
      logger.error('Error broadcasting task deleted event', {
        error,
        taskId: task.id,
        workspaceId,
        userId,
      });
    }
  }

  public async handleTaskCompleted(task: Task, workspaceId: string, userId: string): Promise<void> {
    try {
      const data: WSTaskData = {
        task,
        workspaceId,
        userId,
      };
      
      await this.wsService.broadcastTaskEvent(WSEventType.TASK_COMPLETED, data);
      
      logger.info('Broadcasted task completed event', {
        taskId: task.id,
        workspaceId,
        userId,
      });
    } catch (error) {
      logger.error('Error broadcasting task completed event', {
        error,
        taskId: task.id,
        workspaceId,
        userId,
      });
    }
  }

  public async handleTaskMoved(
    task: Task,
    workspaceId: string,
    userId: string,
    previousVersion: Partial<Task>
  ): Promise<void> {
    try {
      const data: WSTaskData = {
        task,
        workspaceId,
        userId,
        previousVersion,
      };
      
      await this.wsService.broadcastTaskEvent(WSEventType.TASK_MOVED, data);
      
      logger.info('Broadcasted task moved event', {
        taskId: task.id,
        workspaceId,
        userId,
        from: previousVersion.status || previousVersion.column,
        to: task.status || task.column,
      });
    } catch (error) {
      logger.error('Error broadcasting task moved event', {
        error,
        taskId: task.id,
        workspaceId,
        userId,
      });
    }
  }

  // Workspace event handlers
  public async handleWorkspaceCreated(workspace: Workspace, userId: string): Promise<void> {
    try {
      const data: WSWorkspaceData = {
        workspace,
        userId,
      };
      
      await this.wsService.broadcastWorkspaceEvent(WSEventType.WORKSPACE_CREATED, data);
      
      logger.info('Broadcasted workspace created event', {
        workspaceId: workspace.id,
        userId,
      });
    } catch (error) {
      logger.error('Error broadcasting workspace created event', {
        error,
        workspaceId: workspace.id,
        userId,
      });
    }
  }

  public async handleWorkspaceUpdated(workspace: Workspace, userId: string): Promise<void> {
    try {
      const data: WSWorkspaceData = {
        workspace,
        userId,
      };
      
      await this.wsService.broadcastWorkspaceEvent(WSEventType.WORKSPACE_UPDATED, data);
      
      logger.info('Broadcasted workspace updated event', {
        workspaceId: workspace.id,
        userId,
      });
    } catch (error) {
      logger.error('Error broadcasting workspace updated event', {
        error,
        workspaceId: workspace.id,
        userId,
      });
    }
  }

  public async handleWorkspaceDeleted(workspace: Workspace, userId: string): Promise<void> {
    try {
      const data: WSWorkspaceData = {
        workspace,
        userId,
      };
      
      await this.wsService.broadcastWorkspaceEvent(WSEventType.WORKSPACE_DELETED, data);
      
      logger.info('Broadcasted workspace deleted event', {
        workspaceId: workspace.id,
        userId,
      });
    } catch (error) {
      logger.error('Error broadcasting workspace deleted event', {
        error,
        workspaceId: workspace.id,
        userId,
      });
    }
  }

  public async handleWorkspaceMemberAdded(
    workspace: Workspace,
    userId: string,
    member: { userId: string; role: 'owner' | 'admin' | 'member' | 'viewer' }
  ): Promise<void> {
    try {
      const data: WSWorkspaceData = {
        workspace,
        userId,
        member,
      };
      
      await this.wsService.broadcastWorkspaceEvent(WSEventType.WORKSPACE_MEMBER_ADDED, data);
      
      logger.info('Broadcasted workspace member added event', {
        workspaceId: workspace.id,
        userId,
        memberId: member.userId,
        role: member.role,
      });
    } catch (error) {
      logger.error('Error broadcasting workspace member added event', {
        error,
        workspaceId: workspace.id,
        userId,
        memberId: member.userId,
      });
    }
  }

  public async handleWorkspaceMemberRemoved(
    workspace: Workspace,
    userId: string,
    member: { userId: string; role: 'owner' | 'admin' | 'member' | 'viewer' }
  ): Promise<void> {
    try {
      const data: WSWorkspaceData = {
        workspace,
        userId,
        member,
      };
      
      await this.wsService.broadcastWorkspaceEvent(WSEventType.WORKSPACE_MEMBER_REMOVED, data);
      
      logger.info('Broadcasted workspace member removed event', {
        workspaceId: workspace.id,
        userId,
        memberId: member.userId,
        role: member.role,
      });
    } catch (error) {
      logger.error('Error broadcasting workspace member removed event', {
        error,
        workspaceId: workspace.id,
        userId,
        memberId: member.userId,
      });
    }
  }
}

// Export singleton instance
let wsEventHandlers: WebSocketEventHandlers | null = null;

export const getWebSocketEventHandlers = (): WebSocketEventHandlers => {
  if (!wsEventHandlers) {
    wsEventHandlers = new WebSocketEventHandlers();
  }
  return wsEventHandlers;
};

/**
 * Helper functions for easy access from controllers
 */

// Task events
export const broadcastTaskCreated = (task: Task, workspaceId: string, userId: string) =>
  getWebSocketEventHandlers().handleTaskCreated(task, workspaceId, userId);

export const broadcastTaskUpdated = (
  task: Task,
  workspaceId: string,
  userId: string,
  previousVersion?: Partial<Task>
) => getWebSocketEventHandlers().handleTaskUpdated(task, workspaceId, userId, previousVersion);

export const broadcastTaskDeleted = (task: Task, workspaceId: string, userId: string) =>
  getWebSocketEventHandlers().handleTaskDeleted(task, workspaceId, userId);

export const broadcastTaskCompleted = (task: Task, workspaceId: string, userId: string) =>
  getWebSocketEventHandlers().handleTaskCompleted(task, workspaceId, userId);

export const broadcastTaskMoved = (
  task: Task,
  workspaceId: string,
  userId: string,
  previousVersion: Partial<Task>
) => getWebSocketEventHandlers().handleTaskMoved(task, workspaceId, userId, previousVersion);

// Workspace events
export const broadcastWorkspaceCreated = (workspace: Workspace, userId: string) =>
  getWebSocketEventHandlers().handleWorkspaceCreated(workspace, userId);

export const broadcastWorkspaceUpdated = (workspace: Workspace, userId: string) =>
  getWebSocketEventHandlers().handleWorkspaceUpdated(workspace, userId);

export const broadcastWorkspaceDeleted = (workspace: Workspace, userId: string) =>
  getWebSocketEventHandlers().handleWorkspaceDeleted(workspace, userId);

export const broadcastWorkspaceMemberAdded = (
  workspace: Workspace,
  userId: string,
  member: { userId: string; role: 'owner' | 'admin' | 'member' | 'viewer' }
) => getWebSocketEventHandlers().handleWorkspaceMemberAdded(workspace, userId, member);

export const broadcastWorkspaceMemberRemoved = (
  workspace: Workspace,
  userId: string,
  member: { userId: string; role: 'owner' | 'admin' | 'member' | 'viewer' }
) => getWebSocketEventHandlers().handleWorkspaceMemberRemoved(workspace, userId, member);