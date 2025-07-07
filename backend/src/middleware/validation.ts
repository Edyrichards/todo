import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/middleware/errorHandler.js';

export interface ValidationSchemas {
  body?: ZodSchema<any>;
  params?: ZodSchema<any>;
  querystring?: ZodSchema<any>;
  headers?: ZodSchema<any>;
}

export const validate = (schemas: ValidationSchemas) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Validate request body
      if (schemas.body) {
        request.body = schemas.body.parse(request.body);
      }

      // Validate route parameters
      if (schemas.params) {
        request.params = schemas.params.parse(request.params);
      }

      // Validate query parameters
      if (schemas.querystring) {
        request.query = schemas.querystring.parse(request.query);
      }

      // Validate headers
      if (schemas.headers) {
        request.headers = schemas.headers.parse(request.headers);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.received || 'undefined',
        }));

        throw new ValidationError('Validation failed', validationErrors);
      }
      throw error;
    }
  };
};

// Not found handler for validation
export const validationErrorHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  return reply.status(404).send({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method}:${request.url} not found`,
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  });
};

export default { validate, validationErrorHandler };