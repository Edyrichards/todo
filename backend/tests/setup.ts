import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { buildApp } from '@/index.js';
import { connectDatabase, closeDatabase } from '@/utils/database.js';
import { connectRedis, closeRedis } from '@/utils/redis.js';

// Test database setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  
  // Connect to test databases
  await connectDatabase();
  await connectRedis();
});

afterAll(async () => {
  // Close database connections
  await closeDatabase();
  await closeRedis();
});

// Clean up between tests
beforeEach(async () => {
  // Clear Redis cache
  const { cacheService } = await import('@/utils/redis.js');
  await cacheService.flushPattern('*');
});

afterEach(async () => {
  // Additional cleanup if needed
});

// Mock external services
global.fetch = async () => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export { buildApp };