import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenvConfig();

// Environment schema validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3001),
  API_BASE_URL: z.string().url().default('http://localhost:3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  // Database
  DATABASE_URL: z.string().min(1),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default(5432),
  DB_NAME: z.string().default('todoapp'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default(6379),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default(10485760), // 10MB
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default(10),
  SESSION_SECRET: z.string().min(32),
  
  // WebSocket
  WS_PORT: z.string().transform(Number).default(3002),
  
  // Development
  SEED_DATABASE: z.string().transform(val => val === 'true').default(false),
  CREATE_TEST_DATA: z.string().transform(val => val === 'true').default(false),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Monitoring
  PROMETHEUS_ENABLED: z.string().transform(val => val === 'true').default(false),
  PROMETHEUS_PORT: z.string().transform(Number).default(9464),
});

// Validate and export configuration
export const env = envSchema.parse(process.env);

// Database configuration
export const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  min: 2,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Redis configuration
export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
};

// JWT configuration
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  algorithm: 'HS256' as const,
  issuer: 'todo-app',
  audience: 'todo-app-users',
};

// CORS configuration
export const corsConfig = {
  origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
  ],
};

// Rate limiting configuration
export const rateLimitConfig = {
  global: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
  },
  sync: {
    windowMs: 10 * 1000, // 10 seconds
    max: 50, // 50 sync operations per 10 seconds
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// File upload configuration
export const uploadConfig = {
  maxFileSize: env.MAX_FILE_SIZE,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  uploadDir: env.UPLOAD_DIR,
};

// Email configuration
export const emailConfig = env.SMTP_HOST ? {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  from: env.EMAIL_FROM,
} : null;

// Logging configuration
export const logConfig = {
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? 'json' : 'pretty',
  colorize: env.NODE_ENV !== 'production',
  timestamp: true,
  errors: {
    stack: true,
  },
};

// WebSocket configuration
export const wsConfig = {
  port: env.WS_PORT,
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
};

// Security configuration
export const securityConfig = {
  bcryptRounds: env.BCRYPT_ROUNDS,
  sessionSecret: env.SESSION_SECRET,
  helmet: {
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  },
  csrf: env.NODE_ENV === 'production',
};

// Development configuration
export const devConfig = {
  seedDatabase: env.SEED_DATABASE,
  createTestData: env.CREATE_TEST_DATA,
  hotReload: env.NODE_ENV === 'development',
};

// Monitoring configuration
export const monitoringConfig = {
  prometheus: {
    enabled: env.PROMETHEUS_ENABLED,
    port: env.PROMETHEUS_PORT,
    endpoint: '/metrics',
  },
  healthCheck: {
    endpoint: '/health',
    timeout: 5000,
  },
};

// Export all configurations
export const config = {
  env,
  db: dbConfig,
  redis: redisConfig,
  jwt: jwtConfig,
  cors: corsConfig,
  rateLimit: rateLimitConfig,
  upload: uploadConfig,
  email: emailConfig,
  log: logConfig,
  ws: wsConfig,
  security: securityConfig,
  dev: devConfig,
  monitoring: monitoringConfig,
} as const;

// Type for the configuration
export type Config = typeof config;