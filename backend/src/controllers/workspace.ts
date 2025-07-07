import { FastifyRequest, FastifyReply } from 'fastify';
import { query, transaction } from '@/utils/database.js';
import { cacheService } from '@/utils/redis.js';
import { logger } from '@/utils/logger.js';
import { 
  Workspace, 
  WorkspaceMember,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput 
} from '@/types/index.js';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '@/middleware/errorHandler.js';
import {
  broadcastWorkspaceCreated,
  broadcastWorkspaceUpdated,
  broadcastWorkspaceDeleted,
  broadcastWorkspaceMemberAdded,
  broadcastWorkspaceMemberRemoved,
} from '@/handlers/websocket.js';

// Type definitions for request bodies
interface CreateWorkspaceRequestBody {
  name: string;
  description?: string;
}

interface UpdateWorkspaceRequestBody {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}

interface InviteMemberRequestBody {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface WorkspaceParams {
  workspaceId: string;
}

export class WorkspaceController {
  async listWorkspaces(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Get user's workspaces
      const workspaces = await query<Workspace & { role: string; memberCount: number }>(
        `SELECT w.*, wm.role, 
                COUNT(wm2.id) as member_count
         FROM workspaces w
         JOIN workspace_members wm ON wm.workspace_id = w.id
         LEFT JOIN workspace_members wm2 ON wm2.workspace_id = w.id AND wm2.status = 'active'
         WHERE wm.user_id = $1 AND wm.status = 'active'
         GROUP BY w.id, wm.role
         ORDER BY w.created_at DESC`,
        [request.user.id]
      );

      return reply.status(200).send({
        workspaces: workspaces.map(ws => ({
          id: ws.id,
          name: ws.name,
          description: ws.description,
          ownerId: ws.ownerId,
          plan: ws.plan,
          role: ws.role,
          memberCount: parseInt(ws.memberCount.toString()),
          createdAt: ws.createdAt,
          updatedAt: ws.updatedAt,
        })),
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      logger.error('List workspaces failed:', error);
      throw new Error('Failed to list workspaces');
    }
  }

  async getWorkspace(
    request: FastifyRequest<{ Params: WorkspaceParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      const { workspaceId } = request.params;

      // Get workspace with user's role
      const workspaces = await query<Workspace & { role: string; memberCount: number }>(
        `SELECT w.*, wm.role,
                COUNT(wm2.id) as member_count
         FROM workspaces w
         JOIN workspace_members wm ON wm.workspace_id = w.id
         LEFT JOIN workspace_members wm2 ON wm2.workspace_id = w.id AND wm2.status = 'active'
         WHERE w.id = $1 AND wm.user_id = $2 AND wm.status = 'active'
         GROUP BY w.id, wm.role`,
        [workspaceId, request.user.id]
      );

      if (workspaces.length === 0) {
        throw new NotFoundError('Workspace not found');
      }

      const workspace = workspaces[0];

      return reply.status(200).send({
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          ownerId: workspace.ownerId,
          plan: workspace.plan,
          settings: workspace.settings,
          role: workspace.role,
          memberCount: parseInt(workspace.memberCount.toString()),
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Get workspace failed:', error);
      throw new Error('Failed to get workspace');
    }
  }

  async createWorkspace(
    request: FastifyRequest<{ Body: CreateWorkspaceRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      const { name, description } = request.body;

      const workspace = await transaction(async (client) => {
        // Create workspace
        const workspaceResult = await client.query(
          `INSERT INTO workspaces (name, description, owner_id) 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [name, description || null, request.user.id]
        );

        const newWorkspace = workspaceResult.rows[0];

        // Add user as owner member
        await client.query(
          `INSERT INTO workspace_members (user_id, workspace_id, role, joined_at, status) 
           VALUES ($1, $2, 'owner', NOW(), 'active')`,
          [request.user.id, newWorkspace.id]
        );

        // Create default categories
        const defaultCategories = [
          { name: 'Work', color: '#EF4444' },
          { name: 'Personal', color: '#3B82F6' },
          { name: 'Ideas', color: '#10B981' },
        ];

        for (const category of defaultCategories) {
          await client.query(
            `INSERT INTO categories (name, color, workspace_id, created_by) 
             VALUES ($1, $2, $3, $4)`,
            [category.name, category.color, newWorkspace.id, request.user.id]
          );
        }

        return newWorkspace;
      });

      logger.info(`Workspace created: ${workspace.name} (${workspace.id}) by user ${request.user.id}`);

      // Broadcast workspace creation event
      const workspaceData: Workspace = {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        ownerId: workspace.owner_id,
        plan: workspace.plan,
        settings: workspace.settings,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      };
      
      try {
        await broadcastWorkspaceCreated(workspaceData, request.user.id);
      } catch (wsError) {
        logger.warn('Failed to broadcast workspace creation event', { error: wsError, workspaceId: workspace.id });
      }

      return reply.status(201).send({
        message: 'Workspace created successfully',
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          ownerId: workspace.owner_id,
          plan: workspace.plan,
          role: 'owner',
          memberCount: 1,
          createdAt: workspace.created_at,
          updatedAt: workspace.updated_at,
        },
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      logger.error('Create workspace failed:', error);
      throw new Error('Failed to create workspace');
    }
  }

  async updateWorkspace(
    request: FastifyRequest<{ Params: WorkspaceParams; Body: UpdateWorkspaceRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user || !request.workspace) {
        throw new AuthenticationError('Authentication required');
      }

      const { workspaceId } = request.params;
      const { name, description, settings } = request.body;

      // Check if user has admin or owner role
      if (!['owner', 'admin'].includes(request.workspace.role)) {
        throw new AuthorizationError('Insufficient permissions to update workspace');
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }

      if (settings !== undefined) {
        updates.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(settings));
      }

      if (updates.length === 0) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No valid fields to update',
          },
        });
      }

      updates.push(`updated_at = NOW()`);
      values.push(workspaceId);

      const updatedWorkspaces = await query<Workspace>(
        `UPDATE workspaces SET ${updates.join(', ')} 
         WHERE id = $${paramIndex} 
         RETURNING *`,
        values
      );

      const updatedWorkspace = updatedWorkspaces[0];

      // Clear workspace cache
      await cacheService.invalidateWorkspaceData(workspaceId);

      logger.info(`Workspace updated: ${updatedWorkspace.name} (${workspaceId}) by user ${request.user.id}`);

      // Broadcast workspace update event
      const workspaceData: Workspace = {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        description: updatedWorkspace.description,
        ownerId: updatedWorkspace.ownerId,
        plan: updatedWorkspace.plan,
        settings: updatedWorkspace.settings,
        createdAt: updatedWorkspace.createdAt,
        updatedAt: updatedWorkspace.updatedAt,
      };
      
      try {
        await broadcastWorkspaceUpdated(workspaceData, request.user.id);
      } catch (wsError) {
        logger.warn('Failed to broadcast workspace update event', { error: wsError, workspaceId });
      }

      return reply.status(200).send({
        message: 'Workspace updated successfully',
        workspace: {
          id: updatedWorkspace.id,
          name: updatedWorkspace.name,
          description: updatedWorkspace.description,
          ownerId: updatedWorkspace.ownerId,
          plan: updatedWorkspace.plan,
          settings: updatedWorkspace.settings,
          role: request.workspace.role,
          updatedAt: updatedWorkspace.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error;
      }
      
      logger.error('Update workspace failed:', error);
      throw new Error('Failed to update workspace');
    }
  }

  async deleteWorkspace(
    request: FastifyRequest<{ Params: WorkspaceParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user || !request.workspace) {
        throw new AuthenticationError('Authentication required');
      }

      const { workspaceId } = request.params;

      // Only owner can delete workspace
      if (request.workspace.role !== 'owner') {
        throw new AuthorizationError('Only workspace owner can delete workspace');
      }

      // Get workspace data before deletion for broadcasting
      const workspaceBeforeDeletion = await query<Workspace>(
        'SELECT * FROM workspaces WHERE id = $1',
        [workspaceId]
      );
      
      const workspaceData = workspaceBeforeDeletion[0];
      if (!workspaceData) {
        throw new NotFoundError('Workspace not found');
      }

      // Delete workspace (cascade will handle related data)
      await query(
        'DELETE FROM workspaces WHERE id = $1',
        [workspaceId]
      );

      // Clear workspace cache
      await cacheService.invalidateWorkspaceData(workspaceId);

      logger.info(`Workspace deleted: ${workspaceId} by user ${request.user.id}`);

      // Broadcast workspace deletion event
      try {
        await broadcastWorkspaceDeleted(workspaceData, request.user.id);
      } catch (wsError) {
        logger.warn('Failed to broadcast workspace deletion event', { error: wsError, workspaceId });
      }

      return reply.status(200).send({
        message: 'Workspace deleted successfully',
      });
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error;
      }
      
      logger.error('Delete workspace failed:', error);
      throw new Error('Failed to delete workspace');
    }
  }

  async getWorkspaceMembers(
    request: FastifyRequest<{ Params: WorkspaceParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user || !request.workspace) {
        throw new AuthenticationError('Authentication required');
      }

      const { workspaceId } = request.params;

      // Get workspace members
      const members = await query<WorkspaceMember & { userName: string; userEmail: string }>(
        `SELECT wm.*, u.name as user_name, u.email as user_email
         FROM workspace_members wm
         JOIN users u ON u.id = wm.user_id
         WHERE wm.workspace_id = $1 AND wm.status = 'active'
         ORDER BY wm.role DESC, wm.joined_at ASC`,
        [workspaceId]
      );

      return reply.status(200).send({
        members: members.map(member => ({
          id: member.id,
          userId: member.userId,
          userName: member.userName,
          userEmail: member.userEmail,
          role: member.role,
          joinedAt: member.joinedAt,
          status: member.status,
        })),
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      logger.error('Get workspace members failed:', error);
      throw new Error('Failed to get workspace members');
    }
  }

  // Placeholder for member invitation (requires email service)
  async inviteMember(
    request: FastifyRequest<{ Params: WorkspaceParams; Body: InviteMemberRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user || !request.workspace) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has admin or owner role
      if (!['owner', 'admin'].includes(request.workspace.role)) {
        throw new AuthorizationError('Insufficient permissions to invite members');
      }

      return reply.status(501).send({
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Member invitation not implemented yet',
        },
      });
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error;
      }
      
      logger.error('Invite member failed:', error);
      throw new Error('Failed to invite member');
    }
  }

  async removeMember(
    request: FastifyRequest<{ Params: WorkspaceParams & { memberId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user || !request.workspace) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has admin or owner role
      if (!['owner', 'admin'].includes(request.workspace.role)) {
        throw new AuthorizationError('Insufficient permissions to remove members');
      }

      return reply.status(501).send({
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Member removal not implemented yet',
        },
      });
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error;
      }
      
      logger.error('Remove member failed:', error);
      throw new Error('Failed to remove member');
    }
  }
}

// Singleton instance
export const workspaceController = new WorkspaceController();
export default workspaceController;