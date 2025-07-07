# Todo Backend Development Guide

This guide provides comprehensive instructions for setting up and developing the Todo application backend.

## Quick Start

```bash
# 1. Clone and navigate to backend
cd backend

# 2. Run complete setup
./dev.sh setup

# 3. Start services (requires Docker)
cd .. && ./dev-setup.sh start

# 4. Set up database
cd backend && ./dev.sh migrate && ./dev.sh seed

# 5. Start development server
./dev.sh dev
```

The API will be available at `http://localhost:3001`

## Prerequisites

### Required
- **Node.js 20+**: JavaScript runtime
- **npm 9+**: Package manager
- **PostgreSQL 15+**: Database (via Docker or local install)
- **Redis 7+**: Cache and session store (via Docker or local install)

### Optional
- **Docker & Docker Compose**: For easy database setup
- **pgAdmin**: Database management UI
- **Redis Commander**: Redis management UI

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration management
│   │   └── index.ts         # Environment and app config
│   ├── controllers/         # Request handlers
│   │   ├── auth.ts          # Authentication controller
│   │   └── workspace.ts     # Workspace controller
│   ├── middleware/          # Custom middleware
│   │   ├── auth.ts          # Authentication middleware
│   │   ├── errorHandler.ts  # Global error handling
│   │   └── validation.ts    # Request validation
│   ├── models/              # Data models (future)
│   ├── routes/              # API route definitions
│   │   ├── index.ts         # Route registry
│   │   ├── auth.ts          # Auth routes
│   │   ├── workspaces.ts    # Workspace routes
│   │   └── websocket.ts     # WebSocket routes
│   ├── schemas/             # Validation schemas
│   │   ├── auth.ts          # Auth validation schemas
│   │   └── workspace.ts     # Workspace validation schemas
│   ├── services/            # Business logic
│   │   ├── auth.ts          # Authentication service
│   │   └── websocket.ts     # WebSocket service
│   ├── scripts/             # Database and utility scripts
│   │   ├── migrate.ts       # Database migration runner
│   │   ├── seed.ts          # Database seeding
│   │   └── reset.ts         # Database reset utility
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts         # Shared types
│   │   └── websocket.ts     # WebSocket-specific types
│   ├── utils/               # Utility functions
│   │   ├── database.ts      # Database connection & helpers
│   │   ├── logger.ts        # Logging utilities
│   │   └── redis.ts         # Redis connection & cache service
│   ├── handlers/            # Event handlers
│   │   └── websocket.ts     # WebSocket event broadcasting
│   ├── client/              # Client utilities
│   │   └── websocket-client.ts # WebSocket client library
│   └── index.ts             # Application entry point
├── tests/                   # Test files
│   ├── setup.ts             # Test configuration
│   ├── auth.test.ts         # Authentication tests
│   └── websocket.test.ts    # WebSocket tests
├── database/                # Database files
│   ├── init/                # Initial schema
│   ├── migrations/          # Database migrations
│   └── README.md            # Database documentation
├── docs/                    # Documentation
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Test configuration
├── .eslintrc.json           # Linting rules
├── .prettierrc.json         # Code formatting rules
├── .env.example             # Environment template
├── dev.sh                   # Development helper script
└── README.md                # Project documentation
```

## Development Scripts

The `dev.sh` script provides convenient commands for development:

### Setup Commands
```bash
./dev.sh setup        # Complete project setup
./dev.sh deps          # Install dependencies only
./dev.sh env           # Create .env file
```

### Database Commands
```bash
./dev.sh migrate       # Run database migrations
./dev.sh seed          # Seed database with test data
./dev.sh reset-db      # Reset database (with confirmation)
```

### Development Commands
```bash
./dev.sh dev           # Start development server
./dev.sh build         # Build for production
./dev.sh start         # Start production server
```

### Code Quality Commands
```bash
./dev.sh test          # Run tests
./dev.sh test-coverage # Run tests with coverage
./dev.sh lint          # Check code quality
./dev.sh lint-fix      # Fix linting issues
./dev.sh format        # Format code with Prettier
./dev.sh type-check    # Run TypeScript type checking
```

### Utility Commands
```bash
./dev.sh status        # Show project status
./dev.sh clean         # Clean build artifacts
./dev.sh help          # Show all commands
```

## Environment Configuration

### Required Environment Variables

Create `.env` file (copy from `.env.example`):

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todoapp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todoapp
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=your-session-secret-change-this

# Development
SEED_DATABASE=true
CREATE_TEST_DATA=true
LOG_LEVEL=debug
```

### Optional Environment Variables

```env
# CORS (multiple origins separated by comma)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760       # 10MB
UPLOAD_DIR=./uploads

# Email (for verification and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@todoapp.com

# Monitoring
PROMETHEUS_ENABLED=false
PROMETHEUS_PORT=9464
```

## Database Setup

### Using Docker (Recommended)

```bash
# From project root
./dev-setup.sh start-all

# This starts:
# - PostgreSQL on port 5432
# - Redis on port 6379
# - pgAdmin on http://localhost:8080
# - Redis Commander on http://localhost:8081
```

### Manual Setup

If you prefer local installations:

1. **Install PostgreSQL 15+**
2. **Install Redis 7+**
3. **Create database**: `createdb todoapp`
4. **Update `.env`** with your database credentials

### Database Management

```bash
# Run migrations
./dev.sh migrate

# Seed with test data
./dev.sh seed

# Reset database (removes all data)
./dev.sh reset-db

# Check migration status
npm run db:migrate status

# Create new migration
cp database/migrations/001-initial-schema.sql database/migrations/002-new-feature.sql
```

### Test Data

The seeding script creates:
- **5 test users** (admin@todoapp.com, john@example.com, etc.)
- **3 workspaces** (Personal, Team Alpha, Marketing Team)
- **11 categories** across workspaces
- **12+ sample tasks** with various states
- **Task tags** and workspace memberships

Default admin credentials:
- Email: `admin@todoapp.com`
- Password: `admin123`

## API Development

### Adding New Endpoints

1. **Define types** in `src/types/index.ts`
2. **Create validation schemas** in `src/schemas/`
3. **Implement service logic** in `src/services/`
4. **Create controller** in `src/controllers/`
5. **Define routes** in `src/routes/`
6. **Register routes** in `src/routes/index.ts`
7. **Write tests** in `tests/`

### Example: Adding a new endpoint

```typescript
// 1. Add type (src/types/index.ts)
export interface NewFeature {
  id: string;
  name: string;
  // ...
}

// 2. Create schema (src/schemas/feature.ts)
export const createFeatureSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
  }),
});

// 3. Create service (src/services/feature.ts)
export class FeatureService {
  async createFeature(data: CreateFeatureInput): Promise<NewFeature> {
    // Implementation
  }
}

// 4. Create controller (src/controllers/feature.ts)
export class FeatureController {
  async createFeature(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Implementation
  }
}

// 5. Create routes (src/routes/feature.ts)
async function featureRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/', { preHandler: [validate(createFeatureSchema)] }, 
    featureController.createFeature);
}

// 6. Register routes (src/routes/index.ts)
await fastify.register(featureRoutes, { prefix: '/features' });
```

### Authentication & Authorization

The API uses JWT tokens for authentication:

```typescript
// Protected route (requires valid JWT)
fastify.addHook('preHandler', authMiddleware);

// Workspace access (requires workspace membership)
fastify.addHook('preHandler', requireWorkspaceAccess());

// Admin access (requires admin or owner role)
fastify.addHook('preHandler', requireWorkspaceAccess('admin'));

// Resource ownership (requires user to own the resource)
fastify.addHook('preHandler', requireOwnership('task'));
```

### Error Handling

Use custom error classes for consistent error responses:

```typescript
import { 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '@/middleware/errorHandler.js';

// Examples
throw new AuthenticationError('Invalid credentials');
throw new AuthorizationError('Insufficient permissions');
throw new NotFoundError('Task not found');
throw new ConflictError('Email already exists');
throw new ValidationError('Invalid input', validationDetails);
```

## WebSocket Real-time Communication

The Todo backend provides comprehensive WebSocket support for real-time collaboration and live updates.

### WebSocket Overview

The WebSocket implementation includes:
- **Real-time task updates** - Live task creation, updates, and deletions
- **Workspace collaboration** - Multi-user workspace changes
- **User presence** - Online/offline status tracking
- **Typing indicators** - Real-time typing notifications
- **Offline sync** - Event storage for offline users
- **Connection management** - Auto-reconnection and health monitoring

### WebSocket Endpoints

```
WS  /api/v1/ws          # Main WebSocket connection
GET /api/v1/ws/health   # WebSocket health status
GET /api/v1/ws/metrics  # Connection metrics and statistics
```

### Connection Flow

1. **Connect** to `ws://localhost:3001/api/v1/ws`
2. **Receive welcome** message (`CONNECT` event)
3. **Authenticate** with JWT token (`AUTHENTICATE` event)
4. **Join workspace rooms** automatically based on user permissions
5. **Receive real-time events** for subscribed workspaces

### Event Types

#### Connection Events
- `CONNECT` - Initial connection established
- `DISCONNECT` - Connection closed
- `AUTHENTICATE` - User authentication
- `PING` / `PONG` - Connection health check

#### Task Events
- `TASK_CREATED` - New task created
- `TASK_UPDATED` - Task modified
- `TASK_DELETED` - Task removed
- `TASK_COMPLETED` - Task marked complete
- `TASK_MOVED` - Task moved between columns/statuses

#### Workspace Events
- `WORKSPACE_CREATED` - New workspace created
- `WORKSPACE_UPDATED` - Workspace settings changed
- `WORKSPACE_DELETED` - Workspace removed
- `WORKSPACE_MEMBER_ADDED` - User joined workspace
- `WORKSPACE_MEMBER_REMOVED` - User left workspace

#### Collaboration Events
- `USER_PRESENCE` - User online/offline status
- `USER_TYPING` - Real-time typing indicators
- `CURSOR_POSITION` - Cursor position sharing
- `SYNC_REQUEST` / `SYNC_RESPONSE` - Data synchronization

### Message Format

All WebSocket messages follow this structure:

```typescript
interface WSMessage<T = any> {
  type: WSEventType;           // Event type identifier
  data: T;                     // Event-specific data
  timestamp: string;           // ISO timestamp
  requestId?: string;          // Optional request correlation
  workspaceId?: string;        // Workspace context
}
```

### Authentication

Authenticate your WebSocket connection:

```typescript
// Send authentication message
const authMessage = {
  type: 'AUTHENTICATE',
  data: {
    token: 'your-jwt-token',
    workspaceIds: ['workspace-1', 'workspace-2']
  },
  timestamp: new Date().toISOString()
};

webSocket.send(JSON.stringify(authMessage));

// Successful response
{
  type: 'AUTHENTICATE',
  data: {
    success: true,
    userId: 'user-123'
  },
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

### Broadcasting Events

The WebSocket service automatically broadcasts events when data changes occur:

```typescript
// In your controller
import { broadcastTaskCreated } from '@/handlers/websocket.js';

// After creating a task
const newTask = await createTask(taskData);

// Broadcast to all workspace members
await broadcastTaskCreated(newTask, workspaceId, userId);
```

### Client-Side Integration

Use the provided client library for easy integration:

```typescript
import TodoWebSocketClient from '@/client/websocket-client.js';

// Initialize client
const wsClient = new TodoWebSocketClient({
  url: 'ws://localhost:3001/api/v1/ws',
  token: 'your-jwt-token',
  workspaceIds: ['workspace-1'],
});

// Set up event handlers
wsClient.onTaskCreated((data) => {
  console.log('New task:', data.task);
  // Update UI with new task
});

wsClient.onTaskUpdated((data) => {
  console.log('Task updated:', data.task);
  // Update task in UI
});

wsClient.onUserPresence((data) => {
  console.log('User presence:', data);
  // Update user status indicator
});

// Connect
await wsClient.connect();

// Send presence update
wsClient.updatePresence('workspace-1', 'online');

// Send typing indicator
wsClient.sendTypingIndicator('workspace-1', true, 'task-123');
```

### Testing WebSockets

Test WebSocket functionality:

```bash
# Run WebSocket tests
npx vitest websocket.test.ts

# Test WebSocket health
curl http://localhost:3001/api/v1/ws/health

# Check WebSocket metrics
curl http://localhost:3001/api/v1/ws/metrics
```

### WebSocket Configuration

Configure WebSocket behavior via environment variables:

```env
# WebSocket Settings
WS_PING_INTERVAL=30000          # Ping interval (ms)
WS_CONNECTION_TIMEOUT=60000     # Connection timeout (ms)
WS_MAX_CONNECTIONS=10000        # Max concurrent connections
WS_HEARTBEAT_INTERVAL=5000      # Health check interval (ms)
WS_ENABLE_PRESENCE=true         # Enable presence tracking
WS_ENABLE_TYPING=true           # Enable typing indicators
WS_ENABLE_CURSORS=true          # Enable cursor position sharing
```

### Offline Support

The WebSocket service provides robust offline support:

- **Event storage**: Events are stored in Redis for offline users
- **Sync on reconnect**: Clients receive missed events when reconnecting
- **Conflict resolution**: Built-in strategies for handling conflicts
- **Queue management**: Events are automatically pruned after 7 days

### Performance & Scaling

- **Room-based broadcasting**: Events only sent to relevant workspace members
- **Connection pooling**: Efficient connection management
- **Redis pub/sub**: Scalable event distribution
- **Automatic cleanup**: Inactive connections and rooms are cleaned up
- **Metrics monitoring**: Real-time connection and performance metrics

### Debugging WebSockets

```bash
# Enable WebSocket debug logging
LOG_LEVEL=debug npm run dev

# Monitor Redis for WebSocket events
redis-cli monitor

# Check active WebSocket connections
curl http://localhost:3001/api/v1/ws/metrics

# Test WebSocket connection manually
wscat -c ws://localhost:3001/api/v1/ws
```

### Security Considerations

- **JWT Authentication**: All connections must authenticate with valid JWT
- **Workspace isolation**: Users only receive events for authorized workspaces
- **Rate limiting**: Built-in protection against message flooding
- **Connection limits**: Maximum connection limits prevent resource exhaustion
- **Input validation**: All incoming messages are validated

### Common WebSocket Patterns

```typescript
// Real-time task updates
wsClient.onTaskUpdated((data) => {
  const { task, userId, workspaceId } = data;
  
  // Don't update if current user made the change
  if (userId !== currentUserId) {
    updateTaskInStore(task);
    showNotification(`Task "${task.title}" was updated`);
  }
});

// Presence management
wsClient.onUserPresence((data) => {
  const { userId, status, workspaceId } = data;
  
  updateUserPresence(workspaceId, userId, status);
  
  if (status === 'online') {
    showToast(`${getUserName(userId)} is now online`);
  }
});

// Typing indicators with debouncing
let typingTimeout: NodeJS.Timeout;

input.addEventListener('input', () => {
  wsClient.sendTypingIndicator(workspaceId, true, taskId);
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    wsClient.sendTypingIndicator(workspaceId, false, taskId);
  }, 1000);
});

// Sync on reconnection
wsClient.onConnect(() => {
  // Request sync for all workspaces
  for (const workspaceId of wsClient.workspaceIds) {
    wsClient.requestSync(workspaceId, lastSyncTimestamp);
  }
});
```

## Testing

### Running Tests

```bash
# Run all tests
./dev.sh test

# Run tests with coverage
./dev.sh test-coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest auth.test.ts
```

### Writing Tests

Tests use Vitest and are located in `tests/` directory:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '@/index.js';

describe('Feature API', () => {
  let app: FastifyInstance;
  
  beforeEach(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create a new feature', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/features',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { name: 'Test Feature' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      feature: { name: 'Test Feature' },
    });
  });
});
```

### Test Database

Tests use the same database as development. The test setup:
- Clears Redis cache between tests
- Uses transactions for isolation (future improvement)
- Provides mock utilities and test data factories

## Code Quality

### ESLint Configuration

The project uses ESLint with TypeScript rules:

```bash
# Check linting
./dev.sh lint

# Fix auto-fixable issues
./dev.sh lint-fix
```

### Prettier Configuration

Code formatting is handled by Prettier:

```bash
# Format all code
./dev.sh format
```

### TypeScript

Strict TypeScript configuration with:
- Strict type checking
- Path aliases (`@/*` maps to `src/*`)
- Full type coverage for API requests/responses

```bash
# Type checking
./dev.sh type-check
```

## Production Deployment

### Building for Production

```bash
# Build the application
./dev.sh build

# Start production server
./dev.sh start
```

### Environment Variables for Production

Ensure these are set:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=secure-random-string-256-bits
SESSION_SECRET=another-secure-random-string
```

### Docker Deployment

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

### Health Checks

The application provides health check endpoints:

- `GET /health` - Basic health check
- `GET /ready` - Readiness check with dependencies
- `GET /api/v1/ping` - Simple ping endpoint

## Monitoring & Observability

### Logging

Structured logging with Pino:

```typescript
import { logger, createModuleLogger } from '@/utils/logger.js';

// Basic logging
logger.info('Server started');
logger.error('Error occurred', { error: err.message });

// Module-specific logging
const moduleLogger = createModuleLogger('auth');
moduleLogger.debug('User authenticated', { userId: '123' });
```

### Metrics (Optional)

Enable Prometheus metrics:

```env
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9464
```

Metrics available at `http://localhost:9464/metrics`

### Database Performance

- Connection pooling (2-20 connections)
- Query logging in development
- Comprehensive indexing strategy
- Built-in cleanup functions

## Troubleshooting

### Common Issues

**"Database connection failed"**
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Ensure database exists: `createdb todoapp`

**"Redis connection failed"**
- Check Redis is running
- Verify `REDIS_URL` in `.env`
- Test connection: `redis-cli ping`

**"JWT verification failed"**
- Check `JWT_SECRET` is set in `.env`
- Ensure secret is at least 32 characters
- Verify token format in requests

**"Migration failed"**
- Check database permissions
- Verify migration SQL syntax
- Reset database if needed: `./dev.sh reset-db`

**"Tests failing"**
- Ensure test database is clean
- Check test environment variables
- Verify database schema is up to date

### Getting Help

1. **Check logs**: Application logs show detailed error information
2. **Database logs**: Check PostgreSQL logs for database issues
3. **Redis logs**: Check Redis logs for cache issues
4. **Network issues**: Verify ports are not in use (`lsof -i :3001`)

### Development Tips

1. **Use the dev script**: `./dev.sh` provides all common operations
2. **Enable debug logging**: Set `LOG_LEVEL=debug` in `.env`
3. **Use database tools**: pgAdmin and Redis Commander for GUI management
4. **Test in isolation**: Use transactions or separate test database
5. **Watch file changes**: Development server auto-reloads on changes
6. **Check types early**: Run `./dev.sh type-check` before committing

## Next Steps

1. **Implement remaining features**: Tasks, categories, real-time sync
2. **Add email service**: For verification and password reset
3. **Set up monitoring**: Implement proper logging and metrics
4. **Performance optimization**: Add caching and query optimization
5. **Security hardening**: Add rate limiting and security headers
6. **Documentation**: API documentation with OpenAPI/Swagger

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Check code quality: `./dev.sh lint && ./dev.sh test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Resources

- [Fastify Documentation](https://www.fastify.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Zod Validation](https://zod.dev/)
- [Vitest Testing](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)