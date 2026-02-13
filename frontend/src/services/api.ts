import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// We'll import this dynamically to avoid circular dependency
let getAuthToken: (() => string | null) | undefined;
let refreshToken: (() => Promise<string>) | undefined;

export const setAuthHelpers = (getToken: () => string | null, refresh: () => Promise<string>) => {
  getAuthToken = getToken;
  refreshToken = refresh;
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  if (getAuthToken) {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && refreshToken && !error.config._retry) {
      // Token expired, try to refresh
      try {
        error.config._retry = true;
        const newToken = await refreshToken();
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      } catch {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
