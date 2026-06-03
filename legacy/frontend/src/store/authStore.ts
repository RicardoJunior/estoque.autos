import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  tenant: Tenant | null;
  needsOnboarding: boolean;
}

interface SignupResponse {
  user: User;
  needsOnboarding: boolean;
}

interface MeResponse {
  user: User;
  tenant: Tenant | null;
  needsOnboarding: boolean;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  needsOnboarding: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<string>;
  fetchMe: () => Promise<void>;
  createTenant: (data: {
    name: string;
    slug: string;
    cnpj?: string;
    phone: string;
    whatsapp?: string;
    email: string;
  }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      needsOnboarding: false,
      loading: true,

      signIn: async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
        }

        const data: AuthResponse = await response.json();

        set({
          user: data.user,
          tenant: data.tenant,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          needsOnboarding: data.needsOnboarding,
          loading: false,
        });
      },

      signUp: async (email: string, password: string, name: string, phone?: string) => {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name, phone }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Signup failed');
        }

        const data: SignupResponse = await response.json();

        set({
          user: data.user,
          tenant: null,
          needsOnboarding: data.needsOnboarding,
          loading: false,
        });
      },

      signOut: async () => {
        const token = get().accessToken;

        if (token) {
          try {
            await fetch(`${API_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch {
            // Ignore logout errors
          }
        }

        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          needsOnboarding: false,
          loading: false,
        });
      },

      refreshAccessToken: async () => {
        const token = get().refreshToken;

        if (!token) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: token }),
        });

        if (!response.ok) {
          // Refresh token is invalid, clear auth state
          set({
            user: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            needsOnboarding: false,
            loading: false,
          });
          throw new Error('Session expired');
        }

        const data = await response.json();

        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        return data.accessToken;
      },

      fetchMe: async () => {
        const token = get().accessToken;

        if (!token) {
          set({ loading: false });
          return;
        }

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Token is invalid, try to refresh
            try {
              await get().refreshAccessToken();
              // Retry fetchMe with new token
              await get().fetchMe();
              return;
            } catch {
              // Refresh failed, clear state
              set({
                user: null,
                tenant: null,
                accessToken: null,
                refreshToken: null,
                needsOnboarding: false,
                loading: false,
              });
              return;
            }
          }

          const data: MeResponse = await response.json();

          set({
            user: data.user,
            tenant: data.tenant,
            needsOnboarding: data.needsOnboarding,
            loading: false,
          });
        } catch {
          set({ loading: false });
        }
      },

      createTenant: async (tenantData) => {
        const token = get().accessToken;

        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_URL}/auth/onboarding/tenant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(tenantData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create tenant');
        }

        await response.json();

        // Refresh user data to get updated tenant_id
        await get().fetchMe();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        tenant: state.tenant,
        needsOnboarding: state.needsOnboarding,
      }),
    }
  )
);

// Initialize auth state on app load
useAuthStore.getState().fetchMe();
