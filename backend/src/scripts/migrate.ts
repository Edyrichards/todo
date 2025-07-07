import { PoolClient } from 'pg';
import { getDatabase } from '@/utils/database.js';
import { dbLogger } from '@/utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Migration {
  id: number;
  name: string;
  filename: string;
  applied_at?: Date;
}

// Migration table setup
const MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW()
  );
`;

export class MigrationRunner {
  private db = getDatabase();
  private migrationsDir: string;

  constructor() {
    this.migrationsDir = path.join(__dirname, '../../database/migrations');
  }

  async ensureMigrationsTable(): Promise<void> {
    try {
      await this.db.query(MIGRATION_TABLE_SQL);
      dbLogger.info('Migrations table ready');
    } catch (error) {
      dbLogger.error('Failed to create migrations table:', error);
      throw error;
    }
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    try {
      const result = await this.db.query(
        'SELECT id, name, filename, applied_at FROM migrations ORDER BY id ASC'
      );
      return result.rows;
    } catch (error) {
      dbLogger.error('Failed to get applied migrations:', error);
      throw error;
    }
  }

  async getMigrationFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      if (error.code === 'ENOENT') {
        dbLogger.warn('Migrations directory not found:', this.migrationsDir);
        return [];
      }
      dbLogger.error('Failed to read migrations directory:', error);
      throw error;
    }
  }

  async runMigration(filename: string, client: PoolClient): Promise<void> {
    try {
      const filePath = path.join(this.migrationsDir, filename);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      dbLogger.info(`Running migration: ${filename}`);
      
      // Execute the migration SQL
      await client.query(sql);
      
      // Record the migration
      await client.query(
        'INSERT INTO migrations (name, filename) VALUES ($1, $2)',
        [filename.replace('.sql', ''), filename]
      );
      
      dbLogger.info(`Migration completed: ${filename}`);
    } catch (error) {
      dbLogger.error(`Migration failed: ${filename}`, error);
      throw error;
    }
  }

  async migrate(): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Ensure migrations table exists
      await client.query(MIGRATION_TABLE_SQL);
      
      // Get applied migrations
      const appliedResult = await client.query(
        'SELECT filename FROM migrations ORDER BY id ASC'
      );
      const appliedMigrations = new Set(
        appliedResult.rows.map(row => row.filename)
      );
      
      // Get migration files
      const migrationFiles = await this.getMigrationFiles();
      
      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !appliedMigrations.has(file)
      );
      
      if (pendingMigrations.length === 0) {
        dbLogger.info('No pending migrations');
        await client.query('COMMIT');
        return;
      }
      
      dbLogger.info(`Running ${pendingMigrations.length} pending migrations`);
      
      // Run pending migrations
      for (const filename of pendingMigrations) {
        await this.runMigration(filename, client);
      }
      
      await client.query('COMMIT');
      dbLogger.info('All migrations completed successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      dbLogger.error('Migration failed, rolling back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async rollback(steps: number = 1): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the last N applied migrations
      const result = await client.query(
        'SELECT id, name, filename FROM migrations ORDER BY id DESC LIMIT $1',
        [steps]
      );
      
      if (result.rows.length === 0) {
        dbLogger.info('No migrations to rollback');
        await client.query('COMMIT');
        return;
      }
      
      // For each migration, try to find and run its rollback
      for (const migration of result.rows) {
        const rollbackFile = migration.filename.replace('.sql', '.rollback.sql');
        const rollbackPath = path.join(this.migrationsDir, rollbackFile);
        
        try {
          const rollbackSql = await fs.readFile(rollbackPath, 'utf-8');
          
          dbLogger.info(`Rolling back migration: ${migration.filename}`);
          
          // Execute rollback
          await client.query(rollbackSql);
          
          // Remove from migrations table
          await client.query(
            'DELETE FROM migrations WHERE id = $1',
            [migration.id]
          );
          
          dbLogger.info(`Rollback completed: ${migration.filename}`);
          
        } catch (error) {
          if (error.code === 'ENOENT') {
            dbLogger.warn(`No rollback file found for: ${migration.filename}`);
          } else {
            throw error;
          }
        }
      }
      
      await client.query('COMMIT');
      dbLogger.info('Rollback completed successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      dbLogger.error('Rollback failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async status(): Promise<void> {
    try {
      await this.ensureMigrationsTable();
      
      const [appliedMigrations, migrationFiles] = await Promise.all([
        this.getAppliedMigrations(),
        this.getMigrationFiles(),
      ]);
      
      const appliedSet = new Set(appliedMigrations.map(m => m.filename));
      
      console.log('\n📋 Migration Status\n');
      console.log('Applied Migrations:');
      
      if (appliedMigrations.length === 0) {
        console.log('  None');
      } else {
        appliedMigrations.forEach(migration => {
          console.log(`  ✅ ${migration.filename} (${migration.applied_at})`);
        });
      }
      
      console.log('\nPending Migrations:');
      const pendingMigrations = migrationFiles.filter(file => !appliedSet.has(file));
      
      if (pendingMigrations.length === 0) {
        console.log('  None');
      } else {
        pendingMigrations.forEach(file => {
          console.log(`  ⏳ ${file}`);
        });
      }
      
      console.log(`\nTotal: ${appliedMigrations.length} applied, ${pendingMigrations.length} pending\n`);
      
    } catch (error) {
      dbLogger.error('Failed to get migration status:', error);
      throw error;
    }
  }
}

// CLI runner
async function main(): Promise<void> {
  const command = process.argv[2];
  const migrationRunner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'migrate':
        await migrationRunner.migrate();
        break;
      case 'rollback':
        const steps = parseInt(process.argv[3]) || 1;
        await migrationRunner.rollback(steps);
        break;
      case 'status':
        await migrationRunner.status();
        break;
      default:
        console.log('Usage: tsx migrate.ts <command>');
        console.log('Commands:');
        console.log('  migrate   - Run pending migrations');
        console.log('  rollback [steps] - Rollback N migrations (default: 1)');
        console.log('  status    - Show migration status');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration command failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MigrationRunner;