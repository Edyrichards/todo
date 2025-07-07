import { FastifyPluginAsync } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { getWebSocketService } from '../services/websocket.js';

const websocketRoutes: FastifyPluginAsync = async (fastify) => {
  // WebSocket connection endpoint
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, async (connection: SocketStream, req) => {
      const wsService = getWebSocketService();
      await wsService.handleConnection(connection);
    });
  });

  // WebSocket health check endpoint
  fastify.get('/ws/health', async (request, reply) => {
    try {
      const wsService = getWebSocketService();
      const stats = wsService.getStats();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats,
      };
    } catch (error) {
      reply.status(503);
      return {
        status: 'unhealthy',
        error: 'WebSocket service not available',
        timestamp: new Date().toISOString(),
      };
    }
  });

  // WebSocket metrics endpoint
  fastify.get('/ws/metrics', async (request, reply) => {
    try {
      const wsService = getWebSocketService();
      const stats = wsService.getStats();
      
      return {
        metrics: {
          total_connections: stats.totalConnections,
          authenticated_connections: stats.authenticatedConnections,
          active_rooms: stats.activeRooms,
          messages_per_second: stats.messagesPerSecond,
          last_activity: stats.lastActivity,
          uptime: process.uptime(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      reply.status(503);
      return {
        error: 'WebSocket metrics not available',
        timestamp: new Date().toISOString(),
      };
    }
  });
};

export default websocketRoutes;