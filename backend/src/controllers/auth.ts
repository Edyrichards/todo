import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '@/services/auth.js';
import { authLogger } from '@/utils/logger.js';
import { 
  CreateUserInput, 
  LoginInput, 
  User,
  AuthTokens 
} from '@/types/index.js';
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
} from '@/middleware/errorHandler.js';

// Type definitions for request bodies
interface RegisterRequestBody {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RefreshTokenRequestBody {
  refreshToken: string;
}

interface LogoutRequestBody {
  refreshToken: string;
}

interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdateProfileRequestBody {
  name?: string;
  avatar?: string;
}

export class AuthController {
  async register(
    request: FastifyRequest<{ Body: RegisterRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { email, name, password } = request.body;

      // Create user input
      const createUserInput: CreateUserInput = {
        email,
        name,
        password,
      };

      // Create user
      const user = await authService.createUser(createUserInput);

      // Generate tokens
      const tokens = await authService.generateTokens(user);

      // Send verification email (if email service is configured)
      await authService.sendVerificationEmail(user);

      authLogger.info(`User registered successfully: ${user.email}`);

      return reply.status(201).send({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        tokens,
      });
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      
      authLogger.error('Registration failed:', error);
      throw new Error('Registration failed');
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { email, password } = request.body;

      // Create login input
      const loginInput: LoginInput = {
        email,
        password,
      };

      // Authenticate user
      const user = await authService.authenticateUser(loginInput);

      // Generate tokens
      const tokens = await authService.generateTokens(user);

      authLogger.info(`User logged in successfully: ${user.email}`);

      return reply.status(200).send({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
        },
        tokens,
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      authLogger.error('Login failed:', error);
      throw new AuthenticationError('Login failed');
    }
  }

  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { refreshToken } = request.body;

      // Refresh tokens
      const newTokens = await authService.refreshTokens(refreshToken);

      return reply.status(200).send({
        message: 'Tokens refreshed successfully',
        tokens: newTokens,
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      authLogger.error('Token refresh failed:', error);
      throw new AuthenticationError('Token refresh failed');
    }
  }

  async logout(
    request: FastifyRequest<{ Body: LogoutRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { refreshToken } = request.body;

      // Revoke refresh token
      await authService.revokeToken(refreshToken);

      return reply.status(200).send({
        message: 'Logout successful',
      });
    } catch (error) {
      authLogger.error('Logout failed:', error);
      // Don't throw error for logout - always return success
      return reply.status(200).send({
        message: 'Logout successful',
      });
    }
  }

  async logoutAll(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Revoke all user tokens
      await authService.revokeAllUserTokens(request.user.id);

      return reply.status(200).send({
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      authLogger.error('Logout all failed:', error);
      throw new Error('Logout failed');
    }
  }

  async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Get fresh user data
      const user = await authService.getUserById(request.user.id);
      
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return reply.status(200).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      authLogger.error('Get profile failed:', error);
      throw new Error('Failed to get profile');
    }
  }

  async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      const { name, avatar } = request.body;
      const updateData: Partial<User> = {};

      if (name !== undefined) {
        updateData.name = name;
      }

      if (avatar !== undefined) {
        updateData.avatar = avatar;
      }

      // Update user in database
      const { query } = await import('@/utils/database.js');
      const { cacheService } = await import('@/utils/redis.js');
      
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(updateData.name);
      }

      if (updateData.avatar) {
        updates.push(`avatar = $${paramIndex++}`);
        values.push(updateData.avatar);
      }

      if (updates.length === 0) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No valid fields to update',
          },
        });
      }

      updates.push(`updated_at = NOW()`);
      values.push(request.user.id);

      const updatedUsers = await query<User>(
        `UPDATE users SET ${updates.join(', ')} 
         WHERE id = $${paramIndex} 
         RETURNING id, email, name, avatar, email_verified, last_login_at, created_at, updated_at`,
        values
      );

      const updatedUser = updatedUsers[0];

      // Clear user cache
      await cacheService.invalidateUserData(request.user.id);

      authLogger.info(`Profile updated for user: ${updatedUser.email}`);

      return reply.status(200).send({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          emailVerified: updatedUser.emailVerified,
          lastLoginAt: updatedUser.lastLoginAt,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      authLogger.error('Profile update failed:', error);
      throw new Error('Profile update failed');
    }
  }

  async changePassword(
    request: FastifyRequest<{ Body: ChangePasswordRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      const { currentPassword, newPassword } = request.body;

      // Get user with password hash
      const { query } = await import('@/utils/database.js');
      const users = await query<User & { password_hash: string }>(
        'SELECT id, email, password_hash FROM users WHERE id = $1',
        [request.user.id]
      );

      if (users.length === 0) {
        throw new AuthenticationError('User not found');
      }

      const user = users[0];

      // Verify current password
      const isCurrentPasswordValid = await authService.verifyPassword(
        currentPassword,
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await authService.hashPassword(newPassword);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, request.user.id]
      );

      // Revoke all existing tokens to force re-authentication
      await authService.revokeAllUserTokens(request.user.id);

      authLogger.info(`Password changed for user: ${user.email}`);

      return reply.status(200).send({
        message: 'Password changed successfully. Please log in again.',
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      authLogger.error('Password change failed:', error);
      throw new Error('Password change failed');
    }
  }

  async getSessions(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      const sessions = await authService.getUserSessions(request.user.id);

      return reply.status(200).send({
        sessions: sessions.map(session => ({
          id: session.id,
          deviceInfo: session.device_info,
          ipAddress: session.ip_address,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
          expiresAt: session.expires_at,
        })),
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      authLogger.error('Get sessions failed:', error);
      throw new Error('Failed to get sessions');
    }
  }

  // Placeholder methods for email verification and password reset
  async sendVerificationEmail(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Email verification not implemented yet',
      },
    });
  }

  async verifyEmail(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Email verification not implemented yet',
      },
    });
  }

  async sendPasswordResetEmail(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Password reset not implemented yet',
      },
    });
  }

  async resetPassword(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Password reset not implemented yet',
      },
    });
  }
}

// Singleton instance
export const authController = new AuthController();
export default authController;