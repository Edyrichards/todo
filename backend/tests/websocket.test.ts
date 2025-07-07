import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../src/index.js';
import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { WSEventType, WSMessage, WSAuthData } from '../src/types/websocket.js';
import { generateJWT } from '../src/services/auth.js';

describe('WebSocket Service', () => {
  let app: FastifyInstance;
  let wsUrl: string;
  let testUserId: string;
  let testToken: string;

  beforeAll(async () => {
    // Build the app
    app = await buildApp();
    
    // Start the server
    await app.listen({ port: 0 }); // Use random port
    const address = app.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    wsUrl = `ws://localhost:${port}/api/v1/ws`;
    
    // Create test user and token
    testUserId = 'test-user-123';
    testToken = await generateJWT({ userId: testUserId, email: 'test@example.com' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('WebSocket Connection', () => {
    let ws: WebSocket;

    afterEach(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    it('should establish WebSocket connection', (done) => {
      ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        done();
      });
      
      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should receive welcome message on connection', (done) => {
      ws = new WebSocket(wsUrl);
      
      ws.on('message', (data) => {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === WSEventType.CONNECT) {
          expect(message.data.message).toBe('Connected to Todo WebSocket server');
          expect(message.timestamp).toBeDefined();
          done();
        }
      });
      
      ws.on('error', done);
    });

    it('should handle authentication', (done) => {
      ws = new WebSocket(wsUrl);
      
      let connected = false;
      
      ws.on('message', (data) => {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === WSEventType.CONNECT && !connected) {
          connected = true;
          // Send authentication message
          const authMessage: WSMessage<WSAuthData> = {
            type: WSEventType.AUTHENTICATE,
            data: {
              token: testToken,
              workspaceIds: ['workspace-1', 'workspace-2'],
            },
            timestamp: new Date().toISOString(),
          };
          
          ws.send(JSON.stringify(authMessage));
        } else if (message.type === WSEventType.AUTHENTICATE) {
          expect(message.data.success).toBe(true);
          expect(message.data.userId).toBe(testUserId);
          done();
        }
      });
      
      ws.on('error', done);
    });

    it('should handle ping/pong', (done) => {
      ws = new WebSocket(wsUrl);
      
      let authenticated = false;
      
      ws.on('message', (data) => {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === WSEventType.CONNECT && !authenticated) {
          // Authenticate first
          const authMessage: WSMessage<WSAuthData> = {
            type: WSEventType.AUTHENTICATE,
            data: { token: testToken },
            timestamp: new Date().toISOString(),
          };
          ws.send(JSON.stringify(authMessage));
        } else if (message.type === WSEventType.AUTHENTICATE && !authenticated) {
          authenticated = true;
          // Send ping
          const pingMessage: WSMessage = {
            type: WSEventType.PING,
            data: {},
            timestamp: new Date().toISOString(),
          };
          ws.send(JSON.stringify(pingMessage));
        } else if (message.type === WSEventType.PONG) {
          expect(message.data.timestamp).toBeDefined();
          done();
        }
      });
      
      ws.on('error', done);
    });

    it('should reject invalid authentication', (done) => {
      ws = new WebSocket(wsUrl);
      
      let connected = false;
      
      ws.on('message', (data) => {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === WSEventType.CONNECT && !connected) {
          connected = true;
          // Send invalid authentication
          const authMessage: WSMessage<WSAuthData> = {
            type: WSEventType.AUTHENTICATE,
            data: {
              token: 'invalid-token',
            },
            timestamp: new Date().toISOString(),
          };
          
          ws.send(JSON.stringify(authMessage));
        } else if (message.type === WSEventType.ERROR) {
          expect(message.data.code).toBe('AUTH_ERROR');
          expect(message.data.message).toBe('Authentication failed');
          done();
        }
      });
      
      ws.on('close', () => {
        // Connection should be closed after auth failure
        done();
      });
      
      ws.on('error', done);
    });

    it('should handle malformed messages gracefully', (done) => {
      ws = new WebSocket(wsUrl);
      
      let connected = false;
      
      ws.on('message', (data) => {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === WSEventType.CONNECT && !connected) {
          connected = true;
          // Send malformed message
          ws.send('invalid-json{');
        } else if (message.type === WSEventType.ERROR) {
          expect(message.data.code).toBe('PARSE_ERROR');
          expect(message.data.message).toBe('Invalid message format');
          done();
        }
      });
      
      ws.on('error', done);
    });
  });

  describe('WebSocket Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ws/health',
      });
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.stats).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });

    it('should return metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ws/metrics',
      });
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.metrics).toBeDefined();
      expect(body.metrics.total_connections).toBeDefined();
      expect(body.metrics.authenticated_connections).toBeDefined();
      expect(body.metrics.active_rooms).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('Real-time Broadcasting', () => {
    let ws1: WebSocket;
    let ws2: WebSocket;

    afterEach(() => {
      if (ws1 && ws1.readyState === WebSocket.OPEN) ws1.close();
      if (ws2 && ws2.readyState === WebSocket.OPEN) ws2.close();
    });

    it('should broadcast events to room members', (done) => {
      const workspaceId = 'test-workspace-123';
      let ws1Authenticated = false;
      let ws2Authenticated = false;
      let broadcastReceived = false;

      // Create first connection
      ws1 = new WebSocket(wsUrl);
      ws1.on('message', (data) => {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === WSEventType.CONNECT && !ws1Authenticated) {
          const authMessage: WSMessage<WSAuthData> = {
            type: WSEventType.AUTHENTICATE,
            data: {
              token: testToken,
              workspaceIds: [workspaceId],
            },
            timestamp: new Date().toISOString(),
          };
          ws1.send(JSON.stringify(authMessage));
        } else if (message.type === WSEventType.AUTHENTICATE && !ws1Authenticated) {
          ws1Authenticated = true;
          checkBothAuthenticated();
        } else if (message.type === WSEventType.USER_PRESENCE && !broadcastReceived) {
          broadcastReceived = true;
          expect(message.data.userId).toBeDefined();
          expect(message.data.workspaceId).toBe(workspaceId);
          done();
        }
      });

      // Create second connection
      ws2 = new WebSocket(wsUrl);
      ws2.on('message', (data) => {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === WSEventType.CONNECT && !ws2Authenticated) {
          const authMessage: WSMessage<WSAuthData> = {
            type: WSEventType.AUTHENTICATE,
            data: {
              token: testToken,
              workspaceIds: [workspaceId],
            },
            timestamp: new Date().toISOString(),
          };
          ws2.send(JSON.stringify(authMessage));
        } else if (message.type === WSEventType.AUTHENTICATE && !ws2Authenticated) {
          ws2Authenticated = true;
          checkBothAuthenticated();
        }
      });

      function checkBothAuthenticated() {
        if (ws1Authenticated && ws2Authenticated) {
          // Send presence update from ws2, should be received by ws1
          const presenceMessage: WSMessage = {
            type: WSEventType.USER_PRESENCE,
            data: {
              userId: testUserId,
              workspaceId,
              status: 'online',
              lastSeen: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          };
          ws2.send(JSON.stringify(presenceMessage));
        }
      }
    });
  });
});