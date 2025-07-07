import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { workspaceController } from '@/controllers/workspace.js';
import { validate } from '@/middleware/validation.js';
import { authMiddleware, requireWorkspaceAccess } from '@/middleware/auth.js';
import { workspaceSchemas } from '@/schemas/workspace.js';

async function workspaceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // All workspace routes require authentication
  fastify.addHook('preHandler', authMiddleware);

  // List user's workspaces
  fastify.get('/', workspaceController.listWorkspaces.bind(workspaceController));

  // Create new workspace
  fastify.post(
    '/',
    {
      preHandler: [validate(workspaceSchemas.create)],
    },
    workspaceController.createWorkspace.bind(workspaceController)
  );

  // Workspace-specific routes (require workspace access)
  fastify.register(async function (fastify) {
    // Add workspace access check for all routes in this context
    fastify.addHook('preHandler', requireWorkspaceAccess());

    // Get workspace details
    fastify.get(
      '/:workspaceId',
      {
        preHandler: [validate(workspaceSchemas.workspaceId)],
      },
      workspaceController.getWorkspace.bind(workspaceController)
    );

    // Update workspace (admin/owner only)
    fastify.patch(
      '/:workspaceId',
      {
        preHandler: [
          validate({ ...workspaceSchemas.workspaceId, ...workspaceSchemas.update }),
        ],
      },
      workspaceController.updateWorkspace.bind(workspaceController)
    );

    // Delete workspace (owner only)
    fastify.delete(
      '/:workspaceId',
      {
        preHandler: [validate(workspaceSchemas.workspaceId)],
      },
      workspaceController.deleteWorkspace.bind(workspaceController)
    );

    // Workspace members
    fastify.get(
      '/:workspaceId/members',
      {
        preHandler: [validate(workspaceSchemas.workspaceId)],
      },
      workspaceController.getWorkspaceMembers.bind(workspaceController)
    );

    fastify.post(
      '/:workspaceId/invite',
      {
        preHandler: [
          validate({ ...workspaceSchemas.workspaceId, ...workspaceSchemas.inviteMember }),
        ],
      },
      workspaceController.inviteMember.bind(workspaceController)
    );

    fastify.delete(
      '/:workspaceId/members/:memberId',
      workspaceController.removeMember.bind(workspaceController)
    );
  });

  // Health check for workspace service
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'workspaces',
      timestamp: new Date().toISOString(),
    };
  });
}

export default fp(workspaceRoutes, {
  name: 'workspace-routes',
  dependencies: [],
});