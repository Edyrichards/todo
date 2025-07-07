# Todo App Backend

A high-performance Node.js/TypeScript backend API for the Todo application with real-time synchronization, offline support, and multi-user collaboration features.

## Features

- 🚀 **High Performance**: Built with Fastify for maximum speed
- 🔐 **Authentication**: JWT-based auth with refresh tokens
- 🏢 **Multi-tenant**: Workspace-based organization
- ⚡ **Real-time**: WebSocket support for live updates
- 📱 **Offline-first**: Robust sync with conflict resolution
- 🗄️ **PostgreSQL**: Relational database with full-text search
- 🔄 **Redis**: Caching and session management
- 📊 **Analytics**: Built-in productivity insights
- 🧪 **Testing**: Comprehensive test suite with Vitest
- 📝 **TypeScript**: Full type safety
- 🔍 **Monitoring**: Health checks and metrics

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify 4
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7
- **Validation**: Zod
- **Testing**: Vitest
- **Logging**: Pino
- **ORM**: Raw SQL with pg

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration management
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── index.ts        # Application entry point
├── tests/              # Test files
├── database/           # Database scripts and migrations
├── docs/               # API documentation
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### 1. Environment Setup

From the project root:

```bash
# Start PostgreSQL and Redis with Docker
./dev-setup.sh start-all

# Install dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env
```

### 2. Environment Configuration

Edit `.env` file with your settings:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todoapp

# Redis
REDIS_URL=redis://localhost:6379

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-change-this

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup

The database is automatically initialized when Docker containers start. To manually run migrations:

```bash
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run dev:debug        # Start with debugger

# Building
npm run build            # Compile TypeScript
npm run start            # Start production build

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with test data
npm run db:reset         # Reset database

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
```

### Database Management

Access database management interfaces:

- **pgAdmin**: http://localhost:8080 (admin@todoapp.com / admin)
- **Redis Commander**: http://localhost:8081 (admin / admin)

### API Documentation

Once the server is running, visit:

- **Health Check**: http://localhost:3001/health
- **API Status**: http://localhost:3001/api/v1/status
- **Ping**: http://localhost:3001/api/v1/ping

## API Endpoints

### Authentication
```
POST /api/v1/auth/register    # User registration
POST /api/v1/auth/login       # User login
POST /api/v1/auth/refresh     # Refresh token
POST /api/v1/auth/logout      # User logout
GET  /api/v1/auth/me          # Get current user
```

### Workspaces
```
GET    /api/v1/workspaces                    # List workspaces
POST   /api/v1/workspaces                    # Create workspace
GET    /api/v1/workspaces/:id                # Get workspace
PUT    /api/v1/workspaces/:id                # Update workspace
DELETE /api/v1/workspaces/:id                # Delete workspace
GET    /api/v1/workspaces/:id/members        # List members
POST   /api/v1/workspaces/:id/invite         # Invite member
```

### Tasks
```
GET    /api/v1/workspaces/:workspaceId/tasks       # List tasks
POST   /api/v1/workspaces/:workspaceId/tasks       # Create task
GET    /api/v1/workspaces/:workspaceId/tasks/:id   # Get task
PUT    /api/v1/workspaces/:workspaceId/tasks/:id   # Update task
DELETE /api/v1/workspaces/:workspaceId/tasks/:id   # Delete task
```

### Categories
```
GET    /api/v1/workspaces/:workspaceId/categories       # List categories
POST   /api/v1/workspaces/:workspaceId/categories       # Create category
PUT    /api/v1/workspaces/:workspaceId/categories/:id   # Update category
DELETE /api/v1/workspaces/:workspaceId/categories/:id   # Delete category
```

### Sync
```
POST /api/v1/workspaces/:workspaceId/sync/push   # Push changes
GET  /api/v1/workspaces/:workspaceId/sync/pull   # Pull changes
GET  /api/v1/workspaces/:workspaceId/sync/status # Sync status
```

### Analytics
```
GET /api/v1/workspaces/:workspaceId/analytics/overview      # Overview stats
GET /api/v1/workspaces/:workspaceId/analytics/trends        # Trend data
GET /api/v1/workspaces/:workspaceId/analytics/productivity  # Productivity insights
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register** or **Login** to get access and refresh tokens
2. Include the access token in the `Authorization` header: `Bearer <token>`
3. Use the refresh token to get new access tokens when they expire

### Example Authentication Flow

```javascript
// Login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});

const { accessToken, refreshToken } = await response.json();

// Use access token for API calls
const tasksResponse = await fetch('/api/v1/workspaces/123/tasks', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## WebSocket Events

Real-time updates are available via WebSocket connection:

### Client → Server Events
- `join_workspace`: Join a workspace for real-time updates
- `leave_workspace`: Leave workspace updates
- `task_update`: Update a task in real-time
- `sync_request`: Request sync updates

### Server → Client Events
- `task_created`: New task created
- `task_updated`: Task updated by another user
- `task_deleted`: Task deleted
- `sync_update`: Sync operation completed
- `user_presence`: User online/offline status

## Error Handling

The API returns structured error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_string"
      }
    ]
  },
  "timestamp": "2023-12-07T10:30:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication required
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND_ERROR`: Resource not found
- `CONFLICT_ERROR`: Resource conflict (e.g., duplicate)
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `INTERNAL_SERVER_ERROR`: Server error

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── setup.ts              # Test setup and mocks
├── unit/                 # Unit tests
├── integration/          # Integration tests
└── e2e/                  # End-to-end tests
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { buildApp } from '@/index.js';

describe('Auth API', () => {
  it('should register a new user', async () => {
    const app = await buildApp();
    
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      }
    });
    
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  });
});
```

## Deployment

### Docker

```bash
# Build image
docker build -t todo-backend .

# Run container
docker run -p 3001:3001 --env-file .env todo-backend
```

### Environment Variables

Ensure these are set in production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=secure-random-string-256-bits
SESSION_SECRET=another-secure-random-string
```

## Performance

### Caching Strategy

- **User data**: Cached for 1 hour
- **Workspace data**: Cached for 5 minutes
- **Analytics**: Cached for 1 hour
- **Session data**: Redis-based with TTL

### Database Optimization

- Comprehensive indexing strategy
- Connection pooling (2-20 connections)
- Full-text search with PostgreSQL
- Query optimization and logging

### Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per minute
- **Sync endpoints**: 50 requests per 10 seconds

## Monitoring

### Health Checks

- `GET /health`: Basic health check
- `GET /ready`: Ready check with dependencies

### Metrics

- Request duration and count
- Database query performance
- Cache hit/miss ratios
- WebSocket connection count

### Logging

Structured logging with different levels:

```typescript
import { logger } from '@/utils/logger.js';

logger.info('User authenticated', { userId: '123' });
logger.error('Database error', { error: err.message });
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint:fix`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.