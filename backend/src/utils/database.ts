import { Pool, PoolClient } from 'pg';
import { config } from '@/config/index.js';
import { dbLogger } from '@/utils/logger.js';

let pool: Pool | null = null;

export async function connectDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  try {
    pool = new Pool({
      connectionString: config.env.DATABASE_URL,
      ...config.db,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    dbLogger.info('Database connected successfully');
    
    // Handle pool errors
    pool.on('error', (err) => {
      dbLogger.error('Database pool error:', err);
    });

    pool.on('connect', () => {
      dbLogger.debug('New database client connected');
    });

    pool.on('remove', () => {
      dbLogger.debug('Database client removed from pool');
    });

    return pool;
  } catch (error) {
    dbLogger.error('Failed to connect to database:', error);
    throw error;
  }
}

export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbLogger.info('Database connection closed');
  }
}

// Query helper with logging
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await getDatabase().connect();
  
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    dbLogger.debug({
      query: text,
      params,
      duration: `${duration}ms`,
      rows: result.rowCount,
    }, 'Database query executed');
    
    return result.rows;
  } catch (error) {
    dbLogger.error({
      query: text,
      params,
      error: error.message,
    }, 'Database query failed');
    throw error;
  } finally {
    client.release();
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getDatabase().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    dbLogger.error('Database health check failed:', error);
    return false;
  }
}

export default { connectDatabase, getDatabase, closeDatabase, query, transaction, checkDatabaseHealth };