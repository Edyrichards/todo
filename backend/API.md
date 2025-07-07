# Todo Backend API Documentation

Version: 1.0.0  
Base URL: `http://localhost:3001/api/v1`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General API endpoints**: 100 requests per minute per IP
- **Sync endpoints**: 50 requests per 10 seconds per IP

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  },
  "timestamp": "2023-12-07T10:30:00.000Z",
  "path": "/api/v1/endpoint"
}
```

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication required
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND_ERROR` - Resource not found
- `CONFLICT_ERROR` - Resource conflict (e.g., duplicate email)
- `RATE_LIMIT_ERROR` - Rate limit exceeded
- `INTERNAL_SERVER_ERROR` - Server error

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "emailVerified": false,
    "createdAt": "2023-12-07T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresAt": 1701945000000,
    "tokenType": "Bearer"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "rememberMe": false
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "emailVerified": true,
    "lastLoginAt": "2023-12-07T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresAt": 1701945000000,
    "tokenType": "Bearer"
  }
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response (200):**
```json
{
  "message": "Tokens refreshed successfully",
  "tokens": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token",
    "expiresAt": 1701945000000,
    "tokenType": "Bearer"
  }
}
```

### Logout
```http
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar": "https://example.com/avatar.jpg",
    "emailVerified": true,
    "lastLoginAt": "2023-12-07T10:30:00.000Z",
    "createdAt": "2023-12-07T08:00:00.000Z",
    "updatedAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### Update Profile
```http
PATCH /auth/profile
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "New Name",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "New Name",
    "avatar": "https://example.com/new-avatar.jpg",
    "emailVerified": true,
    "lastLoginAt": "2023-12-07T10:30:00.000Z",
    "createdAt": "2023-12-07T08:00:00.000Z",
    "updatedAt": "2023-12-07T10:35:00.000Z"
  }
}
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully. Please log in again."
}
```

### Get User Sessions
```http
GET /auth/sessions
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "deviceInfo": {},
      "ipAddress": "192.168.1.1",
      "createdAt": "2023-12-07T08:00:00.000Z",
      "lastAccessedAt": "2023-12-07T10:30:00.000Z",
      "expiresAt": "2023-12-14T08:00:00.000Z"
    }
  ]
}
```

### Logout All Devices
```http
POST /auth/logout-all
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logged out from all devices successfully"
}
```

## Workspace Endpoints

All workspace endpoints require authentication.

### List User Workspaces
```http
GET /workspaces
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "workspaces": [
    {
      "id": "uuid",
      "name": "Personal Workspace",
      "description": "My personal tasks",
      "ownerId": "uuid",
      "plan": "free",
      "role": "owner",
      "memberCount": 1,
      "createdAt": "2023-12-07T08:00:00.000Z",
      "updatedAt": "2023-12-07T08:00:00.000Z"
    }
  ]
}
```

### Create Workspace
```http
POST /workspaces
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "New Workspace",
  "description": "Workspace description"
}
```

**Response (201):**
```json
{
  "message": "Workspace created successfully",
  "workspace": {
    "id": "uuid",
    "name": "New Workspace",
    "description": "Workspace description",
    "ownerId": "uuid",
    "plan": "free",
    "role": "owner",
    "memberCount": 1,
    "createdAt": "2023-12-07T10:30:00.000Z",
    "updatedAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### Get Workspace
```http
GET /workspaces/{workspaceId}
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "workspace": {
    "id": "uuid",
    "name": "Workspace Name",
    "description": "Workspace description",
    "ownerId": "uuid",
    "plan": "free",
    "settings": {},
    "role": "owner",
    "memberCount": 3,
    "createdAt": "2023-12-07T08:00:00.000Z",
    "updatedAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### Update Workspace
```http
PATCH /workspaces/{workspaceId}
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "settings": {
    "theme": "dark"
  }
}
```

**Response (200):**
```json
{
  "message": "Workspace updated successfully",
  "workspace": {
    "id": "uuid",
    "name": "Updated Name",
    "description": "Updated description",
    "ownerId": "uuid",
    "plan": "free",
    "settings": {
      "theme": "dark"
    },
    "role": "owner",
    "updatedAt": "2023-12-07T10:35:00.000Z"
  }
}
```

### Delete Workspace
```http
DELETE /workspaces/{workspaceId}
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Workspace deleted successfully"
}
```

### Get Workspace Members
```http
GET /workspaces/{workspaceId}/members
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "role": "owner",
      "joinedAt": "2023-12-07T08:00:00.000Z",
      "status": "active"
    }
  ]
}
```

### Invite Member (Placeholder)
```http
POST /workspaces/{workspaceId}/invite
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response (501):**
```json
{
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Member invitation not implemented yet"
  }
}
```

## Health Check Endpoints

### API Health Check
```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development"
}
```

### Readiness Check
```http
GET /ready
```

**Response (200):**
```json
{
  "status": "ready",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Simple Ping
```http
GET /ping
```

**Response (200):**
```json
{
  "message": "pong",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Status Endpoint

### API Status
```http
GET /status
```

**Response (200):**
```json
{
  "status": "API is running",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "routes": [
    "GET /api/v1/ping",
    "GET /api/v1/status",
    "POST /api/v1/auth/register",
    "POST /api/v1/auth/login",
    "..."
  ]
}
```

## Validation Rules

### User Registration
- **email**: Valid email format, max 255 characters
- **name**: 1-255 characters, letters and spaces only
- **password**: Min 8 characters, must contain uppercase, lowercase, and number
- **confirmPassword**: Must match password

### Workspace Creation
- **name**: 1-255 characters, required
- **description**: Max 1000 characters, optional

### General Rules
- All UUIDs must be valid UUID v4 format
- Dates must be in ISO 8601 format
- Maximum request body size: 10MB
- All text fields are trimmed of whitespace

## Data Types

### User Object
```typescript
{
  id: string;              // UUID
  email: string;           // Email address
  name: string;            // Display name
  avatar?: string;         // Avatar URL
  emailVerified: boolean;  // Email verification status
  lastLoginAt?: Date;      // Last login timestamp
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Workspace Object
```typescript
{
  id: string;              // UUID
  name: string;            // Workspace name
  description?: string;    // Workspace description
  ownerId: string;         // Owner user ID
  plan: string;            // Subscription plan
  settings: object;        // Workspace settings
  role: string;            // Current user's role
  memberCount: number;     // Number of members
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Auth Tokens Object
```typescript
{
  accessToken: string;     // JWT access token
  refreshToken: string;    // Refresh token
  expiresAt: number;       // Expiration timestamp
  tokenType: "Bearer";     // Token type
}
```

## Future Endpoints

The following endpoints are planned for future implementation:

### Tasks
- `GET /workspaces/{workspaceId}/tasks` - List tasks
- `POST /workspaces/{workspaceId}/tasks` - Create task
- `GET /workspaces/{workspaceId}/tasks/{taskId}` - Get task
- `PUT /workspaces/{workspaceId}/tasks/{taskId}` - Update task
- `DELETE /workspaces/{workspaceId}/tasks/{taskId}` - Delete task

### Categories
- `GET /workspaces/{workspaceId}/categories` - List categories
- `POST /workspaces/{workspaceId}/categories` - Create category
- `PUT /workspaces/{workspaceId}/categories/{categoryId}` - Update category
- `DELETE /workspaces/{workspaceId}/categories/{categoryId}` - Delete category

### Sync
- `POST /workspaces/{workspaceId}/sync/push` - Push changes
- `GET /workspaces/{workspaceId}/sync/pull` - Pull changes
- `GET /workspaces/{workspaceId}/sync/status` - Sync status

### Analytics
- `GET /workspaces/{workspaceId}/analytics/overview` - Overview stats
- `GET /workspaces/{workspaceId}/analytics/trends` - Trend data
- `GET /workspaces/{workspaceId}/analytics/productivity` - Productivity insights

## Examples

### Complete Authentication Flow

```javascript
// 1. Register
const registerResponse = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'User Name',
    password: 'SecurePassword123',
    confirmPassword: 'SecurePassword123'
  })
});

const { user, tokens } = await registerResponse.json();

// 2. Use access token for API calls
const workspacesResponse = await fetch('/api/v1/workspaces', {
  headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
});

// 3. Refresh token when access token expires
const refreshResponse = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken: tokens.refreshToken })
});

const { tokens: newTokens } = await refreshResponse.json();
```

### Workspace Management

```javascript
// Create workspace
const createResponse = await fetch('/api/v1/workspaces', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Team Workspace',
    description: 'Workspace for team collaboration'
  })
});

const { workspace } = await createResponse.json();

// Update workspace
const updateResponse = await fetch(`/api/v1/workspaces/${workspace.id}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Updated Workspace Name'
  })
});
```

## SDK Development

For client applications, consider creating an SDK that handles:
- Token management and refresh
- Error handling and retries
- Type-safe API calls
- WebSocket connection management
- Offline queue management

Example SDK structure:
```typescript
class TodoAPI {
  private accessToken: string;
  private refreshToken: string;
  
  async login(email: string, password: string): Promise<User>;
  async refreshTokens(): Promise<void>;
  
  // Workspace methods
  async getWorkspaces(): Promise<Workspace[]>;
  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace>;
  
  // Task methods (future)
  async getTasks(workspaceId: string): Promise<Task[]>;
  async createTask(workspaceId: string, data: CreateTaskData): Promise<Task>;
}
```