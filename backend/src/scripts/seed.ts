import { getDatabase } from '@/utils/database.js';
import { dbLogger } from '@/utils/logger.js';
import bcrypt from 'bcrypt';
import { config } from '@/config/index.js';

interface SeedUser {
  id: string;
  email: string;
  name: string;
  password: string;
  emailVerified: boolean;
}

interface SeedWorkspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}

interface SeedCategory {
  name: string;
  color: string;
  workspaceId: string;
  createdBy: string;
}

interface SeedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  completed: boolean;
  categoryId?: string;
  workspaceId: string;
  createdBy: string;
  assignedTo?: string;
  dueDate?: Date;
  isRecurring?: boolean;
  recurringConfig?: any;
}

export class DatabaseSeeder {
  private db = getDatabase();

  async clearExistingData(): Promise<void> {
    try {
      dbLogger.info('Clearing existing data...');
      
      // Clear in reverse order of dependencies
      await this.db.query('DELETE FROM task_comments');
      await this.db.query('DELETE FROM task_attachments');
      await this.db.query('DELETE FROM task_tags');
      await this.db.query('DELETE FROM sync_operations');
      await this.db.query('DELETE FROM tasks');
      await this.db.query('DELETE FROM categories');
      await this.db.query('DELETE FROM workspace_members');
      await this.db.query('DELETE FROM workspaces');
      await this.db.query('DELETE FROM user_sessions');
      await this.db.query('DELETE FROM users');
      await this.db.query('DELETE FROM audit_log WHERE action != \'database_initialized\'');
      
      dbLogger.info('Existing data cleared');
    } catch (error) {
      dbLogger.error('Failed to clear existing data:', error);
      throw error;
    }
  }

  async seedUsers(): Promise<SeedUser[]> {
    const users: SeedUser[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@todoapp.com',
        name: 'Admin User',
        password: 'admin123',
        emailVerified: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'john@example.com',
        name: 'John Doe',
        password: 'password123',
        emailVerified: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'jane@example.com',
        name: 'Jane Smith',
        password: 'password123',
        emailVerified: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'bob@example.com',
        name: 'Bob Wilson',
        password: 'password123',
        emailVerified: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        email: 'alice@example.com',
        name: 'Alice Johnson',
        password: 'password123',
        emailVerified: true,
      },
    ];

    try {
      dbLogger.info('Seeding users...');
      
      for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, config.security.bcryptRounds);
        
        await this.db.query(
          `INSERT INTO users (id, email, name, password_hash, email_verified) 
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, user.email, user.name, hashedPassword, user.emailVerified]
        );
      }
      
      dbLogger.info(`Created ${users.length} users`);
      return users;
    } catch (error) {
      dbLogger.error('Failed to seed users:', error);
      throw error;
    }
  }

  async seedWorkspaces(users: SeedUser[]): Promise<SeedWorkspace[]> {
    const workspaces: SeedWorkspace[] = [
      {
        id: '660e8400-e29b-41d4-a716-446655440000',
        name: 'Personal Workspace',
        description: 'Admin\'s personal workspace',
        ownerId: users[0].id,
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        name: 'Team Alpha',
        description: 'Development team workspace',
        ownerId: users[1].id,
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        name: 'Marketing Team',
        description: 'Marketing team collaboration',
        ownerId: users[2].id,
      },
    ];

    try {
      dbLogger.info('Seeding workspaces...');
      
      for (const workspace of workspaces) {
        await this.db.query(
          `INSERT INTO workspaces (id, name, description, owner_id) 
           VALUES ($1, $2, $3, $4)`,
          [workspace.id, workspace.name, workspace.description, workspace.ownerId]
        );
        
        // Add owner as workspace member
        await this.db.query(
          `INSERT INTO workspace_members (user_id, workspace_id, role, joined_at, status) 
           VALUES ($1, $2, 'owner', NOW(), 'active')`,
          [workspace.ownerId, workspace.id]
        );
      }
      
      // Add additional members to Team Alpha
      await this.db.query(
        `INSERT INTO workspace_members (user_id, workspace_id, role, joined_at, status) 
         VALUES ($1, $2, 'admin', NOW(), 'active')`,
        [users[2].id, workspaces[1].id] // Jane as admin in Team Alpha
      );
      
      await this.db.query(
        `INSERT INTO workspace_members (user_id, workspace_id, role, joined_at, status) 
         VALUES ($1, $2, 'member', NOW(), 'active')`,
        [users[3].id, workspaces[1].id] // Bob as member in Team Alpha
      );
      
      await this.db.query(
        `INSERT INTO workspace_members (user_id, workspace_id, role, joined_at, status) 
         VALUES ($1, $2, 'member', NOW(), 'active')`,
        [users[4].id, workspaces[1].id] // Alice as member in Team Alpha
      );
      
      dbLogger.info(`Created ${workspaces.length} workspaces`);
      return workspaces;
    } catch (error) {
      dbLogger.error('Failed to seed workspaces:', error);
      throw error;
    }
  }

  async seedCategories(workspaces: SeedWorkspace[], users: SeedUser[]): Promise<any[]> {
    const categories: SeedCategory[] = [
      // Personal Workspace categories
      { name: 'Work', color: '#EF4444', workspaceId: workspaces[0].id, createdBy: users[0].id },
      { name: 'Personal', color: '#3B82F6', workspaceId: workspaces[0].id, createdBy: users[0].id },
      { name: 'Shopping', color: '#10B981', workspaceId: workspaces[0].id, createdBy: users[0].id },
      { name: 'Health', color: '#F59E0B', workspaceId: workspaces[0].id, createdBy: users[0].id },
      
      // Team Alpha categories
      { name: 'Development', color: '#8B5CF6', workspaceId: workspaces[1].id, createdBy: users[1].id },
      { name: 'Testing', color: '#EC4899', workspaceId: workspaces[1].id, createdBy: users[1].id },
      { name: 'Documentation', color: '#06B6D4', workspaceId: workspaces[1].id, createdBy: users[1].id },
      { name: 'Bug Fixes', color: '#EF4444', workspaceId: workspaces[1].id, createdBy: users[1].id },
      
      // Marketing Team categories
      { name: 'Campaigns', color: '#F97316', workspaceId: workspaces[2].id, createdBy: users[2].id },
      { name: 'Content', color: '#84CC16', workspaceId: workspaces[2].id, createdBy: users[2].id },
      { name: 'Analytics', color: '#6366F1', workspaceId: workspaces[2].id, createdBy: users[2].id },
    ];

    try {
      dbLogger.info('Seeding categories...');
      
      const createdCategories = [];
      
      for (const category of categories) {
        const result = await this.db.query(
          `INSERT INTO categories (name, color, workspace_id, created_by) 
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [category.name, category.color, category.workspaceId, category.createdBy]
        );
        
        createdCategories.push(result.rows[0]);
      }
      
      dbLogger.info(`Created ${categories.length} categories`);
      return createdCategories;
    } catch (error) {
      dbLogger.error('Failed to seed categories:', error);
      throw error;
    }
  }

  async seedTasks(workspaces: SeedWorkspace[], users: SeedUser[], categories: any[]): Promise<void> {
    // Helper to get random category for workspace
    const getCategoryForWorkspace = (workspaceId: string) => {
      const workspaceCategories = categories.filter(c => c.workspace_id === workspaceId);
      return workspaceCategories[Math.floor(Math.random() * workspaceCategories.length)]?.id;
    };

    // Helper to get random date
    const getRandomDate = (daysFromNow: number) => {
      const date = new Date();
      date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow));
      return date;
    };

    const tasks: SeedTask[] = [
      // Personal Workspace tasks
      {
        title: 'Complete quarterly review',
        description: 'Prepare and submit quarterly performance review',
        priority: 'high',
        status: 'in_progress',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[0].id),
        workspaceId: workspaces[0].id,
        createdBy: users[0].id,
        dueDate: getRandomDate(7),
      },
      {
        title: 'Buy groceries',
        description: 'Weekly grocery shopping - milk, bread, fruits',
        priority: 'medium',
        status: 'todo',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[0].id),
        workspaceId: workspaces[0].id,
        createdBy: users[0].id,
        dueDate: getRandomDate(3),
      },
      {
        title: 'Schedule dentist appointment',
        description: 'Regular checkup and cleaning',
        priority: 'low',
        status: 'todo',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[0].id),
        workspaceId: workspaces[0].id,
        createdBy: users[0].id,
      },
      {
        title: 'Finish reading "Clean Code"',
        description: 'Complete the last 3 chapters',
        priority: 'medium',
        status: 'done',
        completed: true,
        categoryId: getCategoryForWorkspace(workspaces[0].id),
        workspaceId: workspaces[0].id,
        createdBy: users[0].id,
      },

      // Team Alpha tasks
      {
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication system with refresh tokens',
        priority: 'high',
        status: 'in_progress',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[1].id),
        workspaceId: workspaces[1].id,
        createdBy: users[1].id,
        assignedTo: users[3].id,
        dueDate: getRandomDate(5),
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST endpoints with examples',
        priority: 'medium',
        status: 'todo',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[1].id),
        workspaceId: workspaces[1].id,
        createdBy: users[1].id,
        assignedTo: users[4].id,
        dueDate: getRandomDate(10),
      },
      {
        title: 'Fix mobile responsive issues',
        description: 'Address layout problems on mobile devices',
        priority: 'high',
        status: 'in_review',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[1].id),
        workspaceId: workspaces[1].id,
        createdBy: users[2].id,
        assignedTo: users[3].id,
        dueDate: getRandomDate(2),
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure automated testing and deployment',
        priority: 'medium',
        status: 'done',
        completed: true,
        categoryId: getCategoryForWorkspace(workspaces[1].id),
        workspaceId: workspaces[1].id,
        createdBy: users[1].id,
        assignedTo: users[4].id,
      },

      // Marketing Team tasks
      {
        title: 'Launch social media campaign',
        description: 'Create and schedule posts for Q4 campaign',
        priority: 'high',
        status: 'in_progress',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[2].id),
        workspaceId: workspaces[2].id,
        createdBy: users[2].id,
        dueDate: getRandomDate(7),
      },
      {
        title: 'Analyze conversion rates',
        description: 'Review and report on website conversion metrics',
        priority: 'medium',
        status: 'todo',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[2].id),
        workspaceId: workspaces[2].id,
        createdBy: users[2].id,
        dueDate: getRandomDate(14),
      },

      // Recurring task example
      {
        title: 'Daily standup meeting',
        description: 'Team synchronization meeting',
        priority: 'medium',
        status: 'todo',
        completed: false,
        categoryId: getCategoryForWorkspace(workspaces[1].id),
        workspaceId: workspaces[1].id,
        createdBy: users[1].id,
        isRecurring: true,
        recurringConfig: {
          pattern: 'daily',
          interval: 1,
          daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timezone: 'UTC',
        },
      },
    ];

    try {
      dbLogger.info('Seeding tasks...');
      
      for (const task of tasks) {
        await this.db.query(
          `INSERT INTO tasks (
            title, description, priority, status, completed, category_id, 
            workspace_id, created_by, assigned_to, due_date, is_recurring, recurring_config
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            task.title,
            task.description,
            task.priority,
            task.status,
            task.completed,
            task.categoryId,
            task.workspaceId,
            task.createdBy,
            task.assignedTo,
            task.dueDate,
            task.isRecurring || false,
            task.recurringConfig ? JSON.stringify(task.recurringConfig) : null,
          ]
        );
      }
      
      dbLogger.info(`Created ${tasks.length} tasks`);
    } catch (error) {
      dbLogger.error('Failed to seed tasks:', error);
      throw error;
    }
  }

  async seedTaskTags(): Promise<void> {
    const tags = [
      'urgent', 'review-needed', 'blocked', 'quick-win', 'research',
      'frontend', 'backend', 'database', 'testing', 'documentation',
      'bug', 'feature', 'enhancement', 'refactor', 'security',
    ];

    try {
      dbLogger.info('Seeding task tags...');
      
      // Get all tasks
      const tasksResult = await this.db.query('SELECT id FROM tasks');
      const taskIds = tasksResult.rows.map(row => row.id);
      
      // Add random tags to tasks
      for (const taskId of taskIds) {
        const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags per task
        const selectedTags = tags
          .sort(() => 0.5 - Math.random())
          .slice(0, numTags);
        
        for (const tag of selectedTags) {
          await this.db.query(
            'INSERT INTO task_tags (task_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [taskId, tag]
          );
        }
      }
      
      dbLogger.info('Task tags seeded');
    } catch (error) {
      dbLogger.error('Failed to seed task tags:', error);
      throw error;
    }
  }

  async seed(): Promise<void> {
    try {
      dbLogger.info('Starting database seeding...');
      
      if (config.env.NODE_ENV === 'production') {
        throw new Error('Cannot seed database in production environment');
      }
      
      // Clear existing data if in development
      if (config.dev.createTestData) {
        await this.clearExistingData();
      }
      
      // Seed data in order
      const users = await this.seedUsers();
      const workspaces = await this.seedWorkspaces(users);
      const categories = await this.seedCategories(workspaces, users);
      await this.seedTasks(workspaces, users, categories);
      await this.seedTaskTags();
      
      // Log completion
      await this.db.query(
        `INSERT INTO audit_log (action, entity_type, new_data) 
         VALUES ('database_seeded', 'system', $1)`,
        [JSON.stringify({ 
          message: 'Database seeded successfully',
          timestamp: new Date().toISOString(),
          environment: config.env.NODE_ENV,
        })]
      );
      
      dbLogger.info('Database seeding completed successfully');
      
    } catch (error) {
      dbLogger.error('Database seeding failed:', error);
      throw error;
    }
  }
}

// CLI runner
async function main(): Promise<void> {
  const seeder = new DatabaseSeeder();
  
  try {
    await seeder.seed();
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DatabaseSeeder;