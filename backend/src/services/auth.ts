import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '@/config/index.js';
import { query } from '@/utils/database.js';
import { cacheService } from '@/utils/redis.js';
import { authLogger } from '@/utils/logger.js';
import { 
  User, 
  CreateUserInput, 
  LoginInput, 
  AuthTokens,
  JWTPayload 
} from '@/types/index.js';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError 
} from '@/middleware/errorHandler.js';
import crypto from 'crypto';

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly JWT_SECRET = config.jwt.secret;
  private readonly ACCESS_TOKEN_EXPIRES_IN = config.jwt.expiresIn;
  private readonly REFRESH_TOKEN_EXPIRES_IN = config.jwt.refreshExpiresIn;

  // Password utilities
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, config.security.bcryptRounds);
    } catch (error) {
      authLogger.error('Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      authLogger.error('Password verification failed:', error);
      return false;
    }
  }

  // JWT utilities
  generateAccessToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      iss: config.jwt.issuer,
      aud: config.jwt.audience,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      algorithm: config.jwt.algorithm,
    });
  }

  generateRefreshToken(userId: string): string {
    const tokenId = crypto.randomUUID();
    
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      tokenId,
      type: 'refresh',
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      algorithm: config.jwt.algorithm,
    });
  }

  verifyToken(token: string): JWTPayload | RefreshTokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as JWTPayload | RefreshTokenPayload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token');
      }
      throw new AuthenticationError('Token verification failed');
    }
  }

  // User management
  async createUser(input: CreateUserInput): Promise<User> {
    try {
      // Check if user already exists
      const existingUsers = await query<User>(
        'SELECT id FROM users WHERE email = $1',
        [input.email.toLowerCase()]
      );

      if (existingUsers.length > 0) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(input.password);

      // Create user
      const users = await query<User>(
        `INSERT INTO users (email, name, password_hash, email_verified) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, avatar, email_verified, last_login_at, created_at, updated_at`,
        [input.email.toLowerCase(), input.name, passwordHash, false]
      );

      const user = users[0];
      
      authLogger.info(`User created: ${user.email} (${user.id})`);
      
      // Create a default personal workspace
      await this.createDefaultWorkspace(user);
      
      return user;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      authLogger.error('User creation failed:', error);
      throw new Error('User creation failed');
    }
  }

  async authenticateUser(input: LoginInput): Promise<User> {
    try {
      // Find user by email
      const users = await query<User>(
        `SELECT id, email, name, password_hash, avatar, email_verified, last_login_at, created_at, updated_at 
         FROM users WHERE email = $1`,
        [input.email.toLowerCase()]
      );

      if (users.length === 0) {
        throw new AuthenticationError('Invalid email or password');
      }

      const user = users[0];

      // Check if email is verified
      if (!user.emailVerified) {
        throw new AuthenticationError('Email not verified');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(
        input.password, 
        (user as any).password_hash
      );

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Remove password hash from returned user
      delete (user as any).password_hash;

      authLogger.info(`User authenticated: ${user.email} (${user.id})`);
      return user;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      authLogger.error('User authentication failed:', error);
      throw new AuthenticationError('Authentication failed');
    }
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    try {
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user.id);

      // Decode to get expiration
      const decoded = jwt.decode(accessToken) as JWTPayload;
      
      // Store refresh token in Redis with expiration
      const refreshDecoded = jwt.decode(refreshToken) as RefreshTokenPayload;
      const refreshTTL = Math.floor((refreshDecoded.exp * 1000 - Date.now()) / 1000);
      
      await cacheService.set(
        `refresh_token:${refreshDecoded.tokenId}`,
        { userId: user.id, valid: true },
        refreshTTL
      );

      // Store session in database
      await query(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at, device_info, ip_address) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          crypto.createHash('sha256').update(refreshToken).digest('hex'),
          new Date(refreshDecoded.exp * 1000),
          JSON.stringify({}), // TODO: Extract device info from request
          null, // TODO: Extract IP from request
        ]
      );

      authLogger.debug(`Tokens generated for user: ${user.id}`);

      return {
        accessToken,
        refreshToken,
        expiresAt: decoded.exp * 1000,
        tokenType: 'Bearer',
      };
    } catch (error) {
      authLogger.error('Token generation failed:', error);
      throw new Error('Token generation failed');
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken) as RefreshTokenPayload;
      
      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Check if refresh token is valid in cache
      const tokenData = await cacheService.get(`refresh_token:${decoded.tokenId}`);
      if (!tokenData || !tokenData.valid) {
        throw new AuthenticationError('Refresh token revoked or expired');
      }

      // Get user
      const users = await query<User>(
        `SELECT id, email, name, avatar, email_verified, last_login_at, created_at, updated_at 
         FROM users WHERE id = $1 AND email_verified = true`,
        [decoded.userId]
      );

      if (users.length === 0) {
        throw new AuthenticationError('User not found or not verified');
      }

      const user = users[0];

      // Revoke old refresh token
      await cacheService.del(`refresh_token:${decoded.tokenId}`);

      // Generate new tokens
      const newTokens = await this.generateTokens(user);

      authLogger.debug(`Tokens refreshed for user: ${user.id}`);
      return newTokens;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      authLogger.error('Token refresh failed:', error);
      throw new AuthenticationError('Token refresh failed');
    }
  }

  async revokeToken(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.decode(refreshToken) as RefreshTokenPayload;
      
      if (decoded && decoded.tokenId) {
        // Remove from cache
        await cacheService.del(`refresh_token:${decoded.tokenId}`);
        
        // Mark session as inactive in database
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await query(
          'DELETE FROM user_sessions WHERE token_hash = $1',
          [tokenHash]
        );
        
        authLogger.debug(`Token revoked for user: ${decoded.userId}`);
      }
    } catch (error) {
      authLogger.error('Token revocation failed:', error);
      // Don't throw error for revocation failures
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Remove all refresh tokens for user from cache
      await cacheService.flushPattern(`refresh_token:*`); // TODO: Make this more specific
      
      // Remove all sessions for user from database
      await query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );
      
      // Clear user cache
      await cacheService.invalidateUserData(userId);
      
      authLogger.info(`All tokens revoked for user: ${userId}`);
    } catch (error) {
      authLogger.error('Failed to revoke all user tokens:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      // Try cache first
      let user = await cacheService.getUserData(userId);
      
      if (!user) {
        // Fetch from database
        const users = await query<User>(
          `SELECT id, email, name, avatar, email_verified, last_login_at, created_at, updated_at 
           FROM users WHERE id = $1 AND email_verified = true`,
          [userId]
        );
        
        if (users.length === 0) {
          return null;
        }
        
        user = users[0];
        
        // Cache for 1 hour
        await cacheService.setUserData(userId, user, 3600);
      }
      
      return user;
    } catch (error) {
      authLogger.error('Failed to get user by ID:', error);
      return null;
    }
  }

  async createDefaultWorkspace(user: User): Promise<void> {
    try {
      // Create default personal workspace
      const workspaces = await query(
        `INSERT INTO workspaces (name, description, owner_id) 
         VALUES ($1, $2, $3) RETURNING id`,
        ['Personal Workspace', 'Your personal task workspace', user.id]
      );
      
      const workspaceId = workspaces[0].id;
      
      // Add user as owner member
      await query(
        `INSERT INTO workspace_members (user_id, workspace_id, role, joined_at, status) 
         VALUES ($1, $2, 'owner', NOW(), 'active')`,
        [user.id, workspaceId]
      );
      
      // Create default categories
      const categories = [
        { name: 'Work', color: '#EF4444' },
        { name: 'Personal', color: '#3B82F6' },
        { name: 'Shopping', color: '#10B981' },
        { name: 'Health', color: '#F59E0B' },
      ];
      
      for (const category of categories) {
        await query(
          `INSERT INTO categories (name, color, workspace_id, created_by) 
           VALUES ($1, $2, $3, $4)`,
          [category.name, category.color, workspaceId, user.id]
        );
      }
      
      authLogger.info(`Default workspace created for user: ${user.id}`);
    } catch (error) {
      authLogger.error('Failed to create default workspace:', error);
      // Don't throw - this is not critical for user creation
    }
  }

  // Email verification (placeholder for now)
  async sendVerificationEmail(user: User): Promise<void> {
    try {
      // TODO: Implement email sending
      authLogger.info(`Verification email would be sent to: ${user.email}`);
    } catch (error) {
      authLogger.error('Failed to send verification email:', error);
    }
  }

  async verifyEmail(token: string): Promise<User> {
    try {
      // TODO: Implement email verification
      throw new Error('Email verification not implemented yet');
    } catch (error) {
      authLogger.error('Email verification failed:', error);
      throw new AuthenticationError('Email verification failed');
    }
  }

  // Password reset (placeholder for now)
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      // TODO: Implement password reset email
      authLogger.info(`Password reset email would be sent to: ${email}`);
    } catch (error) {
      authLogger.error('Failed to send password reset email:', error);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // TODO: Implement password reset
      throw new Error('Password reset not implemented yet');
    } catch (error) {
      authLogger.error('Password reset failed:', error);
      throw new AuthenticationError('Password reset failed');
    }
  }

  // Session management
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await query(
        'DELETE FROM user_sessions WHERE expires_at < NOW()'
      );
      
      const deletedCount = result.length;
      
      if (deletedCount > 0) {
        authLogger.info(`Cleaned up ${deletedCount} expired sessions`);
      }
      
      return deletedCount;
    } catch (error) {
      authLogger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  async getUserSessions(userId: string): Promise<any[]> {
    try {
      const sessions = await query(
        `SELECT id, device_info, ip_address, created_at, last_accessed_at, expires_at
         FROM user_sessions 
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY last_accessed_at DESC`,
        [userId]
      );
      
      return sessions;
    } catch (error) {
      authLogger.error('Failed to get user sessions:', error);
      return [];
    }
  }
}

// Singleton instance
export const authService = new AuthService();
export default authService;