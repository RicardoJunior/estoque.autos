import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { createSupabaseClient, supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'seller']),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'seller']).optional(),
});

const updateCommissionSchema = z.object({
  commission_percentage: z
    .number()
    .min(0, 'Commission must be at least 0')
    .max(100, 'Commission cannot exceed 100'),
});

/**
 * Get all users in the tenant
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseClient(req.user.access_token);

    // Get all users in the tenant (including inactive)
    const { data: users, error } = await supabase
      .from('users')
      .select(
        'id, name, email, phone, avatar_url, role, is_active, commission_percentage, created_at'
      )
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    return res.json({ users });
  } catch (error) {
    console.error('Error in getUsers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    if (!tenantId || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseClient(req.user.access_token);

    // Get user by ID
    const { data: user, error } = await supabase
      .from('users')
      .select(
        'id, name, email, phone, avatar_url, role, is_active, commission_percentage, created_at'
      )
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error in getUserById:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create a new user (seller/manager) and send invite email
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validationResult = createUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { name, email, phone, role } = validationResult.data;

    // Check if user with this email already exists in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers.users.some((u) => u.email === email);

    if (userExists) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate a temporary password (user will reset via email)
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
    });

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    // Create user record in users table
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        tenant_id: tenantId,
        email,
        name,
        phone: phone || null,
        role,
        is_active: true,
        commission_percentage: 0,
      })
      .select(
        'id, name, email, phone, avatar_url, role, is_active, commission_percentage, created_at'
      )
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({ error: 'Failed to create user record' });
    }

    // Send password reset email to allow user to set their own password
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (resetError) {
      console.error('Error sending invite email:', resetError);
      // Don't fail the request, user is created successfully
    }

    return res.status(201).json({
      user: newUser,
      message: 'User created successfully. Invite email sent.',
    });
  } catch (error) {
    console.error('Error in createUser:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user information
 */
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    if (!tenantId || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validationResult = updateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const updateData = validationResult.data;

    // Prevent users from changing their own role
    if (id === req.user.id && updateData.role) {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    const supabase = createSupabaseClient(req.user.access_token);

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(
        'id, name, email, phone, avatar_url, role, is_active, commission_percentage, created_at'
      )
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error in updateUser:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Deactivate/activate user
 */
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    if (!tenantId || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Prevent users from deactivating themselves
    if (id === req.user.id) {
      return res.status(403).json({ error: 'You cannot deactivate your own account' });
    }

    const supabase = createSupabaseClient(req.user.access_token);

    // Get current user status
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle status
    const newStatus = !currentUser.is_active;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(
        'id, name, email, phone, avatar_url, role, is_active, commission_percentage, created_at'
      )
      .single();

    if (error) {
      console.error('Error toggling user status:', error);
      return res.status(500).json({ error: 'Failed to update user status' });
    }

    return res.json({
      user: updatedUser,
      message: newStatus ? 'User activated successfully' : 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user commission percentage
 */
export const updateUserCommission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    if (!tenantId || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validationResult = updateCommissionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { commission_percentage } = validationResult.data;

    const supabase = createSupabaseClient(req.user.access_token);

    // Update commission
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ commission_percentage })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(
        'id, name, email, phone, avatar_url, role, is_active, commission_percentage, created_at'
      )
      .single();

    if (error) {
      console.error('Error updating commission:', error);
      return res.status(500).json({ error: 'Failed to update commission' });
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: updatedUser,
      message: 'Commission updated successfully',
    });
  } catch (error) {
    console.error('Error in updateUserCommission:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
