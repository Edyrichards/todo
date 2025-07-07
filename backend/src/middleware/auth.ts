import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError, AuthorizationError } from '@/middleware/errorHandler.js';
import { authLogger } from '@/utils/logger.js';
import { cacheService } from '@/utils/redis.js';
import { query } from '@/utils/database.js';
import { User, WorkspaceMember } from '@/types/index.js';

// Extend Fastify types for user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    workspace?: {
      id: string;
      role: string;
    };
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    // Verify JWT token
    const payload = await request.jwtVerify() as JWTPayload;
    
    // Get user from cache first
    let user = await cacheService.getUserData(payload.userId);
    
    if (!user) {
      // Fetch user from database
      const users = await query<User>(
        'SELECT id, email, name, avatar, email_verified, last_login_at, created_at, updated_at FROM users WHERE id = $1 AND email_verified = true',
        [payload.userId]
      );
      
      if (users.length === 0) {
        authLogger.warn(`Authentication failed: User not found or not verified: ${payload.userId}`);
        throw new AuthenticationError('User not found or not verified');
      }
      
      user = users[0];
      
      // Cache user data for 1 hour
      await cacheService.setUserData(payload.userId, user, 3600);
    }
    
    // Attach user to request
    request.user = user;
    
    authLogger.debug(`User authenticated: ${user.email} (${user.id})`);
  } catch (error) {
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      throw new AuthenticationError('Authentication token required');
    }
    
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      throw new AuthenticationError('Authentication token expired');
    }
    
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      throw new AuthenticationError('Invalid authentication token');
    }
    
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    authLogger.error('Authentication error:', error);
    throw new AuthenticationError('Authentication failed');
  }
};

export const requireWorkspaceAccess = (
  requiredRole?: 'owner' | 'admin' | 'member' | 'viewer'
) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    const workspaceId = request.params?.workspaceId as string;
    if (!workspaceId) {
      throw new AuthorizationError('Workspace ID required');
    }
    
    // Check workspace access from cache first
    const cacheKey = `workspace_access:${request.user.id}:${workspaceId}`;
    let workspaceAccess = await cacheService.get(cacheKey);
    
    if (!workspaceAccess) {
      // Fetch workspace membership from database
      const memberships = await query<WorkspaceMember>(
        `SELECT wm.*, w.name as workspace_name 
         FROM workspace_members wm 
         JOIN workspaces w ON w.id = wm.workspace_id 
         WHERE wm.user_id = $1 AND wm.workspace_id = $2 AND wm.status = 'active'`,
        [request.user.id, workspaceId]
      );
      
      if (memberships.length === 0) {
        authLogger.warn(`Workspace access denied: User ${request.user.id} not a member of workspace ${workspaceId}`);
        throw new AuthorizationError('Access denied to workspace');
      }
      
      workspaceAccess = {
        id: workspaceId,
        role: memberships[0].role,
        status: memberships[0].status,
      };
      
      // Cache workspace access for 5 minutes
      await cacheService.set(cacheKey, workspaceAccess, 300);
    }
    
    // Check role permissions if required
    if (requiredRole) {
      const roleHierarchy = {
        viewer: 0,
        member: 1,
        admin: 2,
        owner: 3,
      };
      
      const userRoleLevel = roleHierarchy[workspaceAccess.role as keyof typeof roleHierarchy];
      const requiredRoleLevel = roleHierarchy[requiredRole];
      
      if (userRoleLevel < requiredRoleLevel) {
        authLogger.warn(`Insufficient permissions: User ${request.user.id} has role ${workspaceAccess.role}, requires ${requiredRole}`);
        throw new AuthorizationError(`Insufficient permissions: requires ${requiredRole} role`);
      }
    }
    
    // Attach workspace info to request
    request.workspace = workspaceAccess;
    
    authLogger.debug(`Workspace access granted: User ${request.user.id} has ${workspaceAccess.role} access to workspace ${workspaceId}`);
  };
};

export const requireOwnership = (entityType: 'task' | 'category' | 'workspace') => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    const entityId = request.params?.id as string;
    if (!entityId) {
      throw new AuthorizationError('Entity ID required');
    }
    
    let ownershipQuery: string;
    let params: string[];
    
    switch (entityType) {
      case 'task':
        ownershipQuery = 'SELECT created_by FROM tasks WHERE id = $1';
        params = [entityId];
        break;
      case 'category':
        ownershipQuery = 'SELECT created_by FROM categories WHERE id = $1';
        params = [entityId];
        break;
      case 'workspace':
        ownershipQuery = 'SELECT owner_id as created_by FROM workspaces WHERE id = $1';
        params = [entityId];
        break;
      default:
        throw new AuthorizationError('Invalid entity type');
    }
    
    const results = await query<{ created_by: string }>(ownershipQuery, params);
    
    if (results.length === 0) {
      throw new AuthorizationError('Entity not found');
    }
    
    if (results[0].created_by !== request.user.id) {
      authLogger.warn(`Ownership check failed: User ${request.user.id} does not own ${entityType} ${entityId}`);
      throw new AuthorizationError('You do not have permission to modify this resource');
    }
    
    authLogger.debug(`Ownership verified: User ${request.user.id} owns ${entityType} ${entityId}`);
  };
};

export const requireResourceAccess = (entityType: 'task' | 'category') => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    const entityId = request.params?.id as string;
    if (!entityId) {
      throw new AuthorizationError('Entity ID required');
    }
    
    let accessQuery: string;
    let params: string[];
    
    switch (entityType) {
      case 'task':
        accessQuery = `
          SELECT t.workspace_id 
          FROM tasks t
          JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
          WHERE t.id = $1 AND wm.user_id = $2 AND wm.status = 'active'
        `;
        params = [entityId, request.user.id];
        break;
      case 'category':
        accessQuery = `
          SELECT c.workspace_id 
          FROM categories c
          JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
          WHERE c.id = $1 AND wm.user_id = $2 AND wm.status = 'active'
        `;
        params = [entityId, request.user.id];
        break;
      default:
        throw new AuthorizationError('Invalid entity type');
    }
    
    const results = await query<{ workspace_id: string }>(accessQuery, params);
    
    if (results.length === 0) {
      authLogger.warn(`Resource access denied: User ${request.user.id} cannot access ${entityType} ${entityId}`);
      throw new AuthorizationError('Access denied to resource');
    }
    
    authLogger.debug(`Resource access granted: User ${request.user.id} can access ${entityType} ${entityId}`);
  };
};

// Optional authentication - doesn't throw if no token
export const optionalAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // No token provided, continue without authentication
    }
    
    await authMiddleware(request, reply);
  } catch (error) {
    // Ignore authentication errors for optional auth
    authLogger.debug('Optional authentication failed:', error.message);
  }
};

export default {
  authMiddleware,
  requireWorkspaceAccess,
  requireOwnership,
  requireResourceAccess,
  optionalAuth,
};