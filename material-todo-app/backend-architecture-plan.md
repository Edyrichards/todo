# Backend Integration Architecture Plan
## Real-Time Sync & Multi-User Collaboration

### Executive Summary

This document outlines a comprehensive backend architecture to support the enhanced todo application with real-time synchronization, multi-user collaboration, and offline-first functionality. The architecture is designed to seamlessly integrate with the existing PWA frontend while providing scalable, secure, and performant backend services.

### 1. Overall Architecture

#### 1.1 Architecture Pattern
- **Microservices Architecture**: Modular, scalable services
- **Event-Driven Design**: Async communication via message queues
- **CQRS (Command Query Responsibility Segregation)**: Separate read/write operations
- **API Gateway**: Single entry point with routing, auth, and rate limiting

#### 1.2 Technology Stack

**Core Backend:**
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify (high performance) or NestJS (enterprise-grade)
- **Database**: PostgreSQL 15+ (primary), Redis (caching/sessions)
- **Real-time**: Socket.IO or native WebSockets
- **Message Queue**: Redis/Bull or RabbitMQ
- **Search**: ElasticSearch (optional for advanced search)

**Infrastructure:**
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production) or Docker Swarm (simpler)
- **API Gateway**: Kong, Traefik, or AWS API Gateway
- **File Storage**: AWS S3 or MinIO (self-hosted)
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

### 2. Authentication & Authorization

#### 2.1 Authentication Strategy
```typescript
// JWT-based authentication with refresh tokens
interface AuthTokens {
  accessToken: string;    // Short-lived (15-30 min)
  refreshToken: string;   // Long-lived (7-30 days)
  expiresAt: number;
  tokenType: 'Bearer';
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2.2 Authorization (RBAC)
```typescript
interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface UserRole {
  userId: string;
  roleId: string;
  scopeType: 'global' | 'workspace' | 'project';
  scopeId?: string;
}
```

#### 2.3 Multi-tenancy Support
```typescript
interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: WorkspaceSettings;
  members: WorkspaceMember[];
  createdAt: Date;
}

interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedBy: string;
  joinedAt: Date;
}
```

### 3. Database Design

#### 3.1 Core Entities Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workspace members
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Enhanced tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'medium',
  category_id UUID REFERENCES categories(id),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Dates
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Recurring task support
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_config JSONB,
  is_template BOOLEAN DEFAULT FALSE,
  parent_task_id UUID REFERENCES tasks(id),
  
  -- Kanban support
  status VARCHAR(50) DEFAULT 'todo',
  position INTEGER,
  
  -- Sync metadata
  version INTEGER DEFAULT 1,
  last_synced_at TIMESTAMP,
  sync_status VARCHAR(20) DEFAULT 'synced'
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, workspace_id)
);

-- Task tags (many-to-many)
CREATE TABLE task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, tag)
);

-- Sync operations log
CREATE TABLE sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  entity_type VARCHAR(50) NOT NULL,    -- 'task', 'category'
  entity_id UUID NOT NULL,
  data JSONB NOT NULL,
  version INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  applied BOOLEAN DEFAULT FALSE
);
```

#### 3.2 Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_recurring ON tasks(is_recurring, is_template);

-- Search indexes
CREATE INDEX idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_search ON tasks USING gin(to_tsvector('english', description));

-- Sync indexes
CREATE INDEX idx_sync_operations_user_workspace ON sync_operations(user_id, workspace_id);
CREATE INDEX idx_sync_operations_timestamp ON sync_operations(timestamp);
CREATE INDEX idx_sync_operations_entity ON sync_operations(entity_type, entity_id);
```

### 4. API Design

#### 4.1 RESTful API Structure
```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /register  
│   ├── POST /refresh
│   ├── POST /logout
│   └── GET /me
├── workspaces/
│   ├── GET /workspaces
│   ├── POST /workspaces
│   ├── GET /workspaces/:id
│   ├── PUT /workspaces/:id
│   ├── DELETE /workspaces/:id
│   ├── GET /workspaces/:id/members
│   ├── POST /workspaces/:id/invite
│   └── DELETE /workspaces/:id/members/:userId
├── tasks/
│   ├── GET /workspaces/:workspaceId/tasks
│   ├── POST /workspaces/:workspaceId/tasks
│   ├── GET /workspaces/:workspaceId/tasks/:id
│   ├── PUT /workspaces/:workspaceId/tasks/:id
│   ├── DELETE /workspaces/:workspaceId/tasks/:id
│   ├── POST /workspaces/:workspaceId/tasks/:id/complete
│   └── GET /workspaces/:workspaceId/tasks/recurring
├── categories/
│   ├── GET /workspaces/:workspaceId/categories
│   ├── POST /workspaces/:workspaceId/categories
│   ├── PUT /workspaces/:workspaceId/categories/:id
│   └── DELETE /workspaces/:workspaceId/categories/:id
├── sync/
│   ├── POST /workspaces/:workspaceId/sync/push
│   ├── GET /workspaces/:workspaceId/sync/pull
│   └── GET /workspaces/:workspaceId/sync/status
└── analytics/
    ├── GET /workspaces/:workspaceId/analytics/overview
    ├── GET /workspaces/:workspaceId/analytics/trends
    └── GET /workspaces/:workspaceId/analytics/productivity
```

#### 4.2 WebSocket Events
```typescript
// Client -> Server events
interface ClientEvents {
  'join_workspace': { workspaceId: string };
  'leave_workspace': { workspaceId: string };
  'task_update': { taskId: string; changes: Partial<Task> };
  'sync_request': { lastSyncTime: number };
  'presence_update': { status: 'online' | 'away' | 'busy' };
}

// Server -> Client events
interface ServerEvents {
  'task_created': Task;
  'task_updated': { taskId: string; changes: Partial<Task>; updatedBy: string };
  'task_deleted': { taskId: string; deletedBy: string };
  'category_updated': Category;
  'sync_update': { operations: SyncOperation[] };
  'user_presence': { userId: string; status: string };
  'conflict_detected': { taskId: string; conflicts: ConflictData[] };
}
```

### 5. Real-Time Synchronization Strategy

#### 5.1 Sync Architecture Overview
```typescript
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'task' | 'category';
  entityId: string;
  data: any;
  version: number;
  timestamp: number;
  userId: string;
  workspaceId: string;
}

interface SyncRequest {
  workspaceId: string;
  lastSyncTime: number;
  operations: SyncOperation[];
}

interface SyncResponse {
  operations: SyncOperation[];
  conflicts: ConflictData[];
  serverTime: number;
}
```

#### 5.2 Conflict Resolution Strategy

**Last Writer Wins (with Merge)**
```typescript
interface ConflictResolution {
  strategy: 'last_writer_wins' | 'manual_merge' | 'field_level_merge';
  autoResolve: boolean;
  preserveFields: string[]; // Fields to never auto-resolve
}

class ConflictResolver {
  resolveTaskConflict(
    serverTask: Task, 
    clientTask: Task, 
    strategy: ConflictResolution
  ): Task {
    if (strategy.strategy === 'last_writer_wins') {
      return serverTask.updatedAt > clientTask.updatedAt ? serverTask : clientTask;
    }
    
    if (strategy.strategy === 'field_level_merge') {
      return this.mergeTaskFields(serverTask, clientTask, strategy);
    }
    
    // Return conflict for manual resolution
    throw new ConflictError('Manual resolution required', {
      serverTask,
      clientTask
    });
  }
  
  private mergeTaskFields(server: Task, client: Task, strategy: ConflictResolution): Task {
    const merged = { ...server };
    
    // Merge non-conflicting fields
    for (const [key, value] of Object.entries(client)) {
      if (!strategy.preserveFields.includes(key)) {
        if (server[key] !== value && client.updatedAt > server.updatedAt) {
          merged[key] = value;
        }
      }
    }
    
    return merged;
  }
}
```

#### 5.3 Operational Transform (Advanced)
```typescript
// For collaborative editing of task descriptions
interface Operation {
  type: 'insert' | 'delete' | 'retain';
  length?: number;
  text?: string;
  attributes?: any;
}

class OperationalTransform {
  transform(op1: Operation[], op2: Operation[]): [Operation[], Operation[]] {
    // Implement OT algorithm for text collaboration
    // This ensures convergence when multiple users edit simultaneously
  }
}
```

### 6. Offline-First Implementation

#### 6.1 Client-Side Sync Manager Enhancement
```typescript
// Enhanced version of existing syncManager.ts
class AdvancedSyncManager {
  private wsConnection: WebSocket | null = null;
  private syncQueue: SyncOperation[] = [];
  private conflictResolver: ConflictResolver;
  
  async connectWebSocket(token: string) {
    this.wsConnection = new WebSocket(`wss://api.todoapp.com/ws?token=${token}`);
    
    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeUpdate(data);
    };
  }
  
  async pushChanges(): Promise<void> {
    if (this.syncQueue.length === 0) return;
    
    try {
      const response = await fetch('/api/v1/sync/push', {
        method: 'POST',
        body: JSON.stringify({
          operations: this.syncQueue,
          lastSyncTime: this.getLastSyncTime()
        })
      });
      
      const result = await response.json();
      
      if (result.conflicts?.length > 0) {
        await this.handleConflicts(result.conflicts);
      }
      
      this.syncQueue = [];
      this.setLastSyncTime(result.serverTime);
      
    } catch (error) {
      console.error('Sync failed:', error);
      // Keep operations in queue for retry
    }
  }
  
  private async handleConflicts(conflicts: ConflictData[]) {
    for (const conflict of conflicts) {
      try {
        const resolved = this.conflictResolver.resolve(conflict);
        await this.applyResolvedConflict(resolved);
      } catch (error) {
        // Store for manual resolution
        await this.storeConflictForResolution(conflict);
      }
    }
  }
}
```

#### 6.2 Background Sync Service Worker
```typescript
// Enhanced service worker for background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-tasks') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  const syncManager = new SyncManager();
  
  try {
    await syncManager.pushPendingChanges();
    await syncManager.pullLatestChanges();
    
    // Notify client of successful sync
    self.registration.showNotification('Tasks synced', {
      body: 'Your tasks have been synchronized',
      tag: 'sync-success',
      silent: true
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
```

### 7. Performance & Scalability

#### 7.1 Caching Strategy
```typescript
// Redis caching layers
interface CacheStrategy {
  // User session cache (Redis)
  userSessions: {
    key: `session:${userId}`;
    ttl: 24 * 60 * 60; // 24 hours
    data: UserSession;
  };
  
  // Workspace data cache
  workspaceData: {
    key: `workspace:${workspaceId}:tasks`;
    ttl: 5 * 60; // 5 minutes
    data: Task[];
  };
  
  // Analytics cache (expensive queries)
  analytics: {
    key: `analytics:${workspaceId}:${period}`;
    ttl: 60 * 60; // 1 hour
    data: AnalyticsData;
  };
}
```

#### 7.2 Database Optimization
```sql
-- Partitioning for large datasets
CREATE TABLE tasks_partitioned (
  LIKE tasks INCLUDING ALL
) PARTITION BY HASH (workspace_id);

-- Create partitions
CREATE TABLE tasks_partition_1 PARTITION OF tasks_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE tasks_partition_2 PARTITION OF tasks_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
-- ... more partitions

-- Read replicas for analytics
-- Configure read-only replicas for heavy analytics queries
```

#### 7.3 Rate Limiting & Throttling
```typescript
interface RateLimit {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

const rateLimits = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },      // 5 login attempts per 15min
  api: { windowMs: 60 * 1000, maxRequests: 100 },         // 100 API calls per minute
  sync: { windowMs: 10 * 1000, maxRequests: 50 },         // 50 sync ops per 10sec
  websocket: { windowMs: 1000, maxRequests: 10 }          // 10 WS messages per second
};
```

### 8. Security Implementation

#### 8.1 API Security
```typescript
// Input validation with Joi/Zod
const taskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional(),
  categoryId: z.string().uuid().optional()
});

// Authorization middleware
const requireWorkspaceAccess = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    
    const hasAccess = await checkWorkspacePermission(userId, workspaceId, permission);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

#### 8.2 Data Encryption
```typescript
// Encrypt sensitive data at rest
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  
  encrypt(text: string, key: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encryptedData: EncryptedData, key: string): string {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 9. Analytics & Monitoring

#### 9.1 Application Metrics
```typescript
// Prometheus metrics
const promClient = require('prom-client');

const metrics = {
  httpRequestDuration: new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  }),
  
  activeConnections: new promClient.Gauge({
    name: 'websocket_active_connections',
    help: 'Number of active WebSocket connections'
  }),
  
  syncOperations: new promClient.Counter({
    name: 'sync_operations_total',
    help: 'Total number of sync operations',
    labelNames: ['type', 'status']
  }),
  
  taskMetrics: new promClient.Counter({
    name: 'tasks_total',
    help: 'Total number of tasks',
    labelNames: ['workspace_id', 'status']
  })
};
```

#### 9.2 Health Checks
```typescript
// Health check endpoints
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalServices()
  ]);
  
  const health = {
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: checks[0].status === 'fulfilled' ? 'up' : 'down',
      redis: checks[1].status === 'fulfilled' ? 'up' : 'down',
      external: checks[2].status === 'fulfilled' ? 'up' : 'down'
    }
  };
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### 10. Deployment Strategy

#### 10.1 Docker Configuration
```dockerfile
# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY dist/ ./dist/
COPY public/ ./public/

# Security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S todoapp -u 1001
USER todoapp

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

#### 10.2 Kubernetes Deployment
```yaml
# k8s deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: todo-backend
  template:
    metadata:
      labels:
        app: todo-backend
    spec:
      containers:
      - name: backend
        image: todo-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 10.3 CI/CD Pipeline
```yaml
# GitHub Actions
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: npm ci
      working-directory: backend
    
    - name: Run tests
      run: npm test
      working-directory: backend
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test
        REDIS_URL: redis://localhost:6379
    
    - name: Build
      run: npm run build
      working-directory: backend
    
    - name: Build Docker image
      run: docker build -t todo-backend:${{ github.sha }} .
      working-directory: backend
    
    - name: Deploy to staging
      if: github.ref == 'refs/heads/main'
      run: |
        # Deploy to staging environment
        kubectl set image deployment/todo-backend backend=todo-backend:${{ github.sha }}
```

### 11. Integration with Frontend PWA

#### 11.1 Enhanced Sync Manager
```typescript
// Update existing syncManager.ts to work with backend
export class BackendSyncManager extends SyncManager {
  private apiBaseUrl: string;
  private authToken: string | null = null;
  
  constructor(apiBaseUrl: string) {
    super();
    this.apiBaseUrl = apiBaseUrl;
  }
  
  async authenticate(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    
    const { accessToken } = await response.json();
    this.authToken = accessToken;
    
    // Store in secure storage
    await this.storeAuthToken(accessToken);
  }
  
  async syncWithBackend(): Promise<void> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }
    
    // Get pending operations from IndexedDB
    const pendingOps = await this.offlineDB.getPendingOperations();
    
    // Push to backend
    const pushResponse = await fetch(`${this.apiBaseUrl}/sync/push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operations: pendingOps,
        lastSyncTime: await this.getLastSyncTime()
      })
    });
    
    const pushResult = await pushResponse.json();
    
    // Handle conflicts
    if (pushResult.conflicts?.length > 0) {
      await this.handleConflicts(pushResult.conflicts);
    }
    
    // Pull latest changes
    const pullResponse = await fetch(
      `${this.apiBaseUrl}/sync/pull?since=${await this.getLastSyncTime()}`,
      {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      }
    );
    
    const pullResult = await pullResponse.json();
    
    // Apply changes to local store
    await this.applyRemoteOperations(pullResult.operations);
    
    // Update last sync time
    await this.setLastSyncTime(pullResult.serverTime);
    
    // Clear pending operations
    await this.offlineDB.clearPendingOperations();
  }
}
```

### 12. Migration Strategy

#### 12.1 Data Migration
```typescript
// Migrate existing localStorage data to backend
class DataMigration {
  async migrateToBackend(userId: string, workspaceId: string): Promise<void> {
    // Get existing data from localStorage/IndexedDB
    const existingTasks = await this.getExistingTasks();
    const existingCategories = await this.getExistingCategories();
    
    // Batch upload to backend
    await this.batchCreateTasks(existingTasks, workspaceId);
    await this.batchCreateCategories(existingCategories, workspaceId);
    
    // Mark migration complete
    localStorage.setItem('migrated_to_backend', 'true');
  }
  
  async shouldMigrate(): Promise<boolean> {
    return !localStorage.getItem('migrated_to_backend') && 
           await this.hasExistingData();
  }
}
```

#### 12.2 Phased Rollout
1. **Phase 1**: Deploy backend, keep frontend working offline-only
2. **Phase 2**: Add authentication and user accounts
3. **Phase 3**: Enable real-time sync for new users
4. **Phase 4**: Migrate existing users with data preservation
5. **Phase 5**: Enable collaborative features

### 13. Cost Optimization

#### 13.1 Resource Management
```yaml
# Auto-scaling based on load
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: todo-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: todo-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### 13.2 Database Connection Pooling
```typescript
// Optimize database connections
const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings
  min: 2,        // Minimum connections
  max: 20,       // Maximum connections  
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

### 14. Future Enhancements

#### 14.1 Machine Learning Integration
- **Smart Due Date Suggestions**: Based on task complexity and user patterns
- **Priority Recommendations**: AI-powered task prioritization
- **Time Estimation**: ML models to predict task completion time
- **Productivity Insights**: Advanced analytics with ML-driven recommendations

#### 14.2 Advanced Collaboration
- **Real-time Collaborative Editing**: Operational Transform for task descriptions
- **Voice Notes**: Audio attachments with transcription
- **Video Calls**: Integrated video conferencing for task discussions
- **Shared Workspaces**: Team collaboration with advanced permissions

#### 14.3 Mobile Native Apps
- **React Native**: Cross-platform mobile app with native features
- **Offline-first**: Full offline capability with background sync
- **Push Notifications**: Smart notifications for due dates and mentions
- **Widgets**: Home screen widgets for quick task access

### 15. Conclusion

This backend architecture provides a solid foundation for scaling the todo application from a single-user PWA to a collaborative, multi-user platform. The design emphasizes:

- **Reliability**: Offline-first with robust sync mechanisms
- **Scalability**: Microservices architecture with horizontal scaling
- **Security**: Enterprise-grade authentication and authorization
- **Performance**: Optimized database design and caching strategies
- **Maintainability**: Clean architecture with comprehensive testing

The phased rollout approach ensures minimal disruption to existing users while gradually introducing powerful new collaborative features.

#### Next Steps
1. Set up development environment and basic auth service
2. Implement core API endpoints for tasks and categories
3. Develop real-time WebSocket communication
4. Create migration tools for existing users
5. Deploy to staging environment for testing
6. Plan production rollout with monitoring and alerting

This architecture positions the application for long-term success with room for advanced features like AI-powered insights, advanced collaboration tools, and enterprise integrations.