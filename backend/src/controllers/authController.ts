import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const createTenantSchema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  cnpj: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  whatsapp: z.string().optional(),
  email: z.string().email('Invalid email format'),
});

/**
 * Sign up a new user
 * Creates auth user and users table entry
 * Does NOT create tenant - that happens in onboarding
 */
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone } = signupSchema.parse(req.body);

    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        name,
        phone,
      },
    });

    if (authError) {
      throw new AppError(400, authError.message);
    }

    if (!authData.user) {
      throw new AppError(500, 'Failed to create user');
    }

    // Users table entry will be created by database trigger
    // Wait a moment for the trigger to execute
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fetch the created user from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone, role, is_active, tenant_id')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      // If user doesn't exist in table, create it manually
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          phone,
          role: 'owner', // First user is always owner
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        throw new AppError(500, 'Failed to create user profile');
      }

      return res.status(201).json({
        user: newUser,
        needsOnboarding: true,
      });
    }

    res.status(201).json({
      user: userData,
      needsOnboarding: !userData.tenant_id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * Returns access token, refresh token, and user data
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!data.user || !data.session) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Fetch user details from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, email, name, phone, avatar_url, role, is_active')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      throw new AppError(404, 'User profile not found');
    }

    if (!userData.is_active) {
      throw new AppError(403, 'Account is deactivated');
    }

    // Fetch tenant details if user has a tenant
    let tenant = null;
    if (userData.tenant_id) {
      const { data: tenantData } = await supabaseAdmin
        .from('tenants')
        .select('id, name, slug, logo_url, template_id, colors, phone, whatsapp, email')
        .eq('id', userData.tenant_id)
        .single();

      tenant = tenantData;
    }

    res.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: userData,
      tenant,
      needsOnboarding: !userData.tenant_id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new AppError(401, 'Invalid refresh token');
    }

    res.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    // Fetch full user details
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, email, name, phone, avatar_url, role, is_active, created_at')
      .eq('id', req.user.id)
      .single();

    if (userError || !userData) {
      throw new AppError(404, 'User not found');
    }

    // Fetch tenant details if user has a tenant
    let tenant = null;
    if (userData.tenant_id) {
      const { data: tenantData } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single();

      tenant = tenantData;
    }

    res.json({
      user: userData,
      tenant,
      needsOnboarding: !userData.tenant_id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create tenant (onboarding)
 * This is called after signup to set up the user's store
 */
export const createTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    // Only owners can create tenants, and only if they don't have one
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('tenant_id, role')
      .eq('id', req.user.id)
      .single();

    if (currentUser?.tenant_id) {
      throw new AppError(400, 'User already has a tenant');
    }

    if (currentUser?.role !== 'owner') {
      throw new AppError(403, 'Only owners can create tenants');
    }

    const { name, slug, cnpj, phone, whatsapp, email } = createTenantSchema.parse(req.body);

    // Check if slug is already taken
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingTenant) {
      throw new AppError(400, 'This slug is already taken');
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name,
        slug,
        cnpj,
        phone,
        whatsapp: whatsapp || phone,
        email,
        template_id: 1, // Default to template 1
        colors: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#10b981',
        },
        settings: {},
      })
      .select()
      .single();

    if (tenantError) {
      throw new AppError(500, tenantError.message);
    }

    // Update user with tenant_id
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ tenant_id: tenant.id })
      .eq('id', req.user.id);

    if (updateError) {
      // Rollback: delete tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
      throw new AppError(500, 'Failed to link user to tenant');
    }

    res.status(201).json({
      tenant,
      message: 'Tenant created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side should clear tokens)
 */
export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Supabase handles session invalidation automatically
    // This endpoint is mainly for logging/analytics purposes
    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
