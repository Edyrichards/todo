import { getDatabase } from '@/utils/database.js';
import { dbLogger } from '@/utils/logger.js';
import { config } from '@/config/index.js';
import DatabaseSeeder from './seed.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseReset {
  private db = getDatabase();

  async dropAllTables(): Promise<void> {
    try {
      dbLogger.info('Dropping all tables...');
      
      // Disable foreign key checks temporarily
      await this.db.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Get all table names
      const tablesResult = await this.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = current_schema()
        AND table_type = 'BASE TABLE'
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      
      // Drop all tables
      for (const table of tables) {
        await this.db.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        dbLogger.debug(`Dropped table: ${table}`);
      }
      
      // Re-enable foreign key checks
      await this.db.query('SET FOREIGN_KEY_CHECKS = 1');
      
      dbLogger.info(`Dropped ${tables.length} tables`);
    } catch (error) {
      dbLogger.error('Failed to drop tables:', error);
      throw error;
    }
  }

  async recreateSchema(): Promise<void> {
    try {
      dbLogger.info('Recreating database schema...');
      
      // Read the initial schema file
      const schemaPath = path.join(__dirname, '../../database/init/01-init-schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf-8');
      
      // Execute the schema
      await this.db.query(schemaSql);
      
      dbLogger.info('Database schema recreated');
    } catch (error) {
      dbLogger.error('Failed to recreate schema:', error);
      throw error;
    }
  }

  async reset(seedData: boolean = true): Promise<void> {
    try {
      if (config.env.NODE_ENV === 'production') {
        throw new Error('Cannot reset database in production environment');
      }
      
      dbLogger.info('Starting database reset...');
      
      // Drop all tables
      await this.dropAllTables();
      
      // Recreate schema
      await this.recreateSchema();
      
      // Seed data if requested
      if (seedData) {
        const seeder = new DatabaseSeeder();
        await seeder.seed();
      }
      
      dbLogger.info('Database reset completed successfully');
      
    } catch (error) {
      dbLogger.error('Database reset failed:', error);
      throw error;
    }
  }

  async resetMigrations(): Promise<void> {
    try {
      dbLogger.info('Resetting migrations table...');
      
      await this.db.query('DROP TABLE IF EXISTS migrations CASCADE');
      
      dbLogger.info('Migrations table reset');
    } catch (error) {
      dbLogger.error('Failed to reset migrations:', error);
      throw error;
    }
  }

  async vacuum(): Promise<void> {
    try {
      dbLogger.info('Running database vacuum...');
      
      // Get all table names
      const tablesResult = await this.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = current_schema()
        AND table_type = 'BASE TABLE'
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      
      // Vacuum each table
      for (const table of tables) {
        await this.db.query(`VACUUM ANALYZE "${table}"`);
        dbLogger.debug(`Vacuumed table: ${table}`);
      }
      
      dbLogger.info('Database vacuum completed');
    } catch (error) {
      dbLogger.error('Database vacuum failed:', error);
      throw error;
    }
  }

  async reindex(): Promise<void> {
    try {
      dbLogger.info('Reindexing database...');
      
      // Reindex all indexes
      await this.db.query('REINDEX DATABASE CONCURRENTLY');
      
      dbLogger.info('Database reindex completed');
    } catch (error) {
      dbLogger.error('Database reindex failed:', error);
      throw error;
    }
  }

  async getStats(): Promise<void> {
    try {
      console.log('\n📊 Database Statistics\n');
      
      // Table sizes
      const sizesResult = await this.db.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = current_schema()
        ORDER BY tablename, attname
      `);
      
      console.log('Table Statistics:');
      if (sizesResult.rows.length === 0) {
        console.log('  No tables found');
      } else {
        let currentTable = '';
        sizesResult.rows.forEach(row => {
          if (row.tablename !== currentTable) {
            console.log(`\n  📋 ${row.tablename}:`);
            currentTable = row.tablename;
          }
          console.log(`    ${row.attname}: ${row.n_distinct} distinct values`);
        });
      }
      
      // Connection info
      const connectionsResult = await this.db.query(`
        SELECT 
          count(*) as active_connections,
          max(now() - backend_start) as longest_connection
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      console.log('\nConnection Statistics:');
      const connStats = connectionsResult.rows[0];
      console.log(`  Active Connections: ${connStats.active_connections}`);
      console.log(`  Longest Connection: ${connStats.longest_connection || 'N/A'}`);
      
      // Database size
      const sizeResult = await this.db.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
      `);
      
      console.log(`\nDatabase Size: ${sizeResult.rows[0].db_size}\n`);
      
    } catch (error) {
      dbLogger.error('Failed to get database stats:', error);
      throw error;
    }
  }
}

// CLI runner
async function main(): Promise<void> {
  const command = process.argv[2];
  const reset = new DatabaseReset();
  
  try {
    switch (command) {
      case 'reset':
        const seedData = process.argv[3] !== '--no-seed';
        await reset.reset(seedData);
        console.log('✅ Database reset completed');
        break;
        
      case 'drop':
        await reset.dropAllTables();
        console.log('✅ All tables dropped');
        break;
        
      case 'schema':
        await reset.recreateSchema();
        console.log('✅ Schema recreated');
        break;
        
      case 'migrations':
        await reset.resetMigrations();
        console.log('✅ Migrations reset');
        break;
        
      case 'vacuum':
        await reset.vacuum();
        console.log('✅ Database vacuum completed');
        break;
        
      case 'reindex':
        await reset.reindex();
        console.log('✅ Database reindex completed');
        break;
        
      case 'stats':
        await reset.getStats();
        break;
        
      default:
        console.log('Usage: tsx reset.ts <command>');
        console.log('Commands:');
        console.log('  reset [--no-seed]  - Full database reset with optional seeding');
        console.log('  drop               - Drop all tables');
        console.log('  schema             - Recreate schema only');
        console.log('  migrations         - Reset migrations table');
        console.log('  vacuum             - Vacuum and analyze all tables');
        console.log('  reindex            - Reindex all indexes');
        console.log('  stats              - Show database statistics');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database reset command failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DatabaseReset;