import pino from 'pino';
import { config } from '@/config/index.js';

// Create logger instance
export const logger = pino({
  level: config.log.level,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(config.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Export specific loggers
export const dbLogger = createModuleLogger('database');
export const redisLogger = createModuleLogger('redis');
export const authLogger = createModuleLogger('auth');
export const syncLogger = createModuleLogger('sync');
export const wsLogger = createModuleLogger('websocket');

export default logger;