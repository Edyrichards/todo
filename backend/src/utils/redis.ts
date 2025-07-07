import { createClient, RedisClientType } from 'redis';
import { config } from '@/config/index.js';
import { redisLogger } from '@/utils/logger.js';

let client: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (client) {
    return client;
  }

  try {
    client = createClient({
      url: config.env.REDIS_URL,
      ...config.redis,
    });

    // Handle Redis events
    client.on('error', (err) => {
      redisLogger.error('Redis client error:', err);
    });

    client.on('connect', () => {
      redisLogger.debug('Redis client connecting');
    });

    client.on('ready', () => {
      redisLogger.info('Redis client ready');
    });

    client.on('end', () => {
      redisLogger.info('Redis client disconnected');
    });

    client.on('reconnecting', () => {
      redisLogger.info('Redis client reconnecting');
    });

    // Connect to Redis
    await client.connect();
    
    // Test the connection
    await client.ping();
    
    redisLogger.info('Redis connected successfully');
    return client;
  } catch (error) {
    redisLogger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export function getRedis(): RedisClientType {
  if (!client) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    redisLogger.info('Redis connection closed');
  }
}

// Cache helpers
export class CacheService {
  private client: RedisClientType;

  constructor() {
    this.client = getRedis();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      redisLogger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      redisLogger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      redisLogger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      redisLogger.error('Cache exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      redisLogger.error('Cache expire error:', error);
      return false;
    }
  }

  async flushPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(keys);
      }
      return 0;
    } catch (error) {
      redisLogger.error('Cache flush pattern error:', error);
      return 0;
    }
  }

  // Session management
  async getSession(sessionId: string): Promise<any> {
    return this.get(`session:${sessionId}`);
  }

  async setSession(sessionId: string, data: any, ttl = 86400): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, ttl);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // User data caching
  async getUserData(userId: string): Promise<any> {
    return this.get(`user:${userId}`);
  }

  async setUserData(userId: string, data: any, ttl = 3600): Promise<boolean> {
    return this.set(`user:${userId}`, data, ttl);
  }

  async invalidateUserData(userId: string): Promise<boolean> {
    return this.del(`user:${userId}`);
  }

  // Workspace data caching
  async getWorkspaceData(workspaceId: string): Promise<any> {
    return this.get(`workspace:${workspaceId}`);
  }

  async setWorkspaceData(workspaceId: string, data: any, ttl = 300): Promise<boolean> {
    return this.set(`workspace:${workspaceId}`, data, ttl);
  }

  async invalidateWorkspaceData(workspaceId: string): Promise<boolean> {
    return this.del(`workspace:${workspaceId}`);
  }

  // Analytics caching
  async getAnalytics(workspaceId: string, period: string): Promise<any> {
    return this.get(`analytics:${workspaceId}:${period}`);
  }

  async setAnalytics(workspaceId: string, period: string, data: any, ttl = 3600): Promise<boolean> {
    return this.set(`analytics:${workspaceId}:${period}`, data, ttl);
  }

  // Rate limiting
  async incrementRateLimit(key: string, windowMs: number): Promise<number> {
    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      const results = await multi.exec();
      return results?.[0] as number || 0;
    } catch (error) {
      redisLogger.error('Rate limit error:', error);
      return 0;
    }
  }

  // Pub/Sub for real-time updates
  async publish(channel: string, message: any): Promise<boolean> {
    try {
      await this.client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      redisLogger.error('Publish error:', error);
      return false;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.client.subscribe(channel, (message) => {
        try {
          callback(JSON.parse(message));
        } catch (error) {
          redisLogger.error('Subscribe callback error:', error);
        }
      });
    } catch (error) {
      redisLogger.error('Subscribe error:', error);
    }
  }
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await getRedis().ping();
    return true;
  } catch (error) {
    redisLogger.error('Redis health check failed:', error);
    return false;
  }
}

// Create a singleton cache service instance
export const cacheService = new CacheService();

export default { connectRedis, getRedis, closeRedis, CacheService, cacheService, checkRedisHealth };