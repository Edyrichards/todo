import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { logger } from '@/utils/logger.js';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;
}

export class CustomError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export const errorHandler = async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // Log the error
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      code: error.code,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      ip: request.ip,
    },
  }, 'Error occurred');

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: validationErrors,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // Handle custom errors
  if (error instanceof CustomError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // Handle Fastify errors
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code || 'HTTP_ERROR',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // Handle JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return reply.status(401).send({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication token required',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    return reply.status(401).send({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.status(401).send({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // Handle database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return reply.status(409).send({
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'Resource already exists',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return reply.status(400).send({
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Invalid reference to related resource',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // Handle multipart errors
  if (error.code === 'FST_FILES_LIMIT') {
    return reply.status(400).send({
      error: {
        code: 'FILE_LIMIT_EXCEEDED',
        message: 'Too many files uploaded',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  if (error.code === 'FST_FILE_SIZE_LIMIT') {
    return reply.status(400).send({
      error: {
        code: 'FILE_SIZE_LIMIT',
        message: 'File size exceeds limit',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // Default internal server error
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  });
};