# Database Setup

This directory contains database initialization scripts and configuration for the Todo App backend.

## Structure

```
database/
├── init/                    # Database initialization scripts
│   └── 01-init-schema.sql  # Main schema creation script
└── backups/                # Database backup storage
```

## Schema Overview

The database schema includes the following main tables:

### Core Tables
- **users**: User accounts and authentication
- **workspaces**: Multi-tenant workspaces
- **workspace_members**: User workspace memberships and roles
- **categories**: Task categorization
- **tasks**: Main task entities with full feature support
- **task_tags**: Many-to-many task tagging
- **task_attachments**: File attachments for tasks
- **task_comments**: Task comments and discussions

### System Tables
- **sync_operations**: Tracks sync operations for offline support
- **user_sessions**: Active user sessions management
- **audit_log**: System audit trail

## Features

### Full-Text Search
- Implemented using PostgreSQL's `tsvector` and GIN indexes
- Searches task titles and descriptions
- Weighted search results (title has higher weight)

### Automatic Timestamps
- All tables have `created_at` and `updated_at` timestamps
- Automatic update triggers maintain `updated_at` fields

### Performance Optimizations
- Comprehensive indexing strategy
- Partitioning ready for large datasets
- Optimized for common query patterns

### Security
- UUID primary keys prevent enumeration attacks
- Proper foreign key constraints
- Row-level security ready (can be enabled)

## Development Data

The initialization script creates:
- A default admin user (`admin@todoapp.com`)
- A personal workspace
- Default categories (Work, Personal, Shopping, Health)

## Maintenance

### Cleanup Functions
- `cleanup_expired_sessions()`: Removes expired user sessions
- Automatic search vector updates
- Audit log rotation (can be scheduled)

## Usage

The database is automatically initialized when Docker containers start.
Manual initialization can be done by running the SQL scripts directly:

```bash
psql -U postgres -d todoapp -f backend/database/init/01-init-schema.sql
```