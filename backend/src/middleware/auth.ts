import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'owner' | 'manager' | 'seller';
    tenantId: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // Verify JWT with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw new AppError(401, 'Invalid or expired token');
    }

    // Fetch user details from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new AppError(401, 'User not found');
    }

    // Attach user info to request
    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      tenantId: userData.tenant_id,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: Array<'owner' | 'manager' | 'seller'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
};
