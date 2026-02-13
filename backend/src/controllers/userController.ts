import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { createSupabaseClient } from '../config/supabase';

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

    // Get all users in the tenant
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
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
      .select('id, name, email, phone, avatar_url, role, is_active, created_at')
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
