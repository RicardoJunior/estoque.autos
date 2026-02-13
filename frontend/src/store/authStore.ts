import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { api } from '@/services/api';
import type { AuthState, User, Tenant } from '@/types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Fetch user profile
      const { data: profile } = await api.get<User>('/auth/profile');
      const { data: tenant } = await api.get<Tenant>('/tenants/current');

      set({ user: profile, tenant, loading: false });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const { data: profile } = await api.get<User>('/auth/profile');
      set({ user: profile, loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, tenant: null, loading: false });
  },

  updateUser: async (data: Partial<User>) => {
    const { data: updatedProfile } = await api.patch<User>('/auth/profile', data);
    set({ user: updatedProfile });
  },
}));

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    Promise.all([api.get<User>('/auth/profile'), api.get<Tenant>('/tenants/current')])
      .then(([{ data: user }, { data: tenant }]) => {
        useAuthStore.setState({ user, tenant, loading: false });
      })
      .catch(() => {
        useAuthStore.setState({ user: null, tenant: null, loading: false });
      });
  } else {
    useAuthStore.setState({ loading: false });
  }
});

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const { data: user } = await api.get<User>('/auth/profile');
    const { data: tenant } = await api.get<Tenant>('/tenants/current');
    useAuthStore.setState({ user, tenant, loading: false });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, tenant: null, loading: false });
  }
});
