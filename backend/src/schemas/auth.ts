import { z } from 'zod';

// User registration schema
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required')
      .max(255, 'Email too long')
      .transform(val => val.toLowerCase()),
    
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name too long')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// User login schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required')
      .transform(val => val.toLowerCase()),
    
    password: z
      .string()
      .min(1, 'Password is required'),
    
    rememberMe: z.boolean().optional().default(false),
  }),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token is required'),
  }),
});

// Logout schema
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token is required'),
  }),
});

// Email verification schema
export const emailVerificationSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Verification token is required'),
  }),
});

// Send verification email schema
export const sendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required')
      .transform(val => val.toLowerCase()),
  }),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required')
      .transform(val => val.toLowerCase()),
  }),
});

// Password reset schema
export const passwordResetSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Reset token is required'),
    
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Change password schema (for authenticated users)
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    
    confirmPassword: z.string(),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name too long')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
      .optional(),
    
    avatar: z
      .string()
      .url('Invalid avatar URL')
      .optional(),
  }),
});

// Common parameter schemas
export const userIdParamSchema = z.object({
  params: z.object({
    userId: z
      .string()
      .uuid('Invalid user ID format'),
  }),
});

// Session management schema
export const revokeSessionSchema = z.object({
  body: z.object({
    sessionId: z
      .string()
      .uuid('Invalid session ID format'),
  }),
});

// Export all schemas
export const authSchemas = {
  register: registerSchema,
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  logout: logoutSchema,
  emailVerification: emailVerificationSchema,
  sendVerification: sendVerificationSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  changePassword: changePasswordSchema,
  updateProfile: updateProfileSchema,
  userIdParam: userIdParamSchema,
  revokeSession: revokeSessionSchema,
} as const;

export default authSchemas;