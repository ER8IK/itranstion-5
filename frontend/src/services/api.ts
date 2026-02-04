import axios, { AxiosError } from 'axios';
import { User, AuthResponse } from '../types';

/**
 * IMPORTANT: API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * NOTA BENE: Request interceptor to add JWT token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * IMPORTANT: Response interceptor for error handling
 * Redirects to login if user is deleted or blocked
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string; redirect?: boolean }>) => {
    if (error.response?.data?.redirect) {
      // User was deleted or blocked - clear token and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication APIs
 */
export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  verify: async (token: string) => {
    const response = await api.get(`/auth/verify?token=${token}`);
    return response.data;
  },
};

/**
 * User management APIs
 */
export const userAPI = {
  getAll: async () => {
    const response = await api.get<{ users: User[] }>('/users');
    return response.data.users;
  },

  block: async (userIds: number[]) => {
    const response = await api.post('/users/block', { userIds });
    return response.data;
  },

  unblock: async (userIds: number[]) => {
    const response = await api.post('/users/unblock', { userIds });
    return response.data;
  },

  delete: async (userIds: number[]) => {
    const response = await api.post('/users/delete', { userIds });
    return response.data;
  },

  deleteUnverified: async () => {
    const response = await api.post('/users/delete-unverified');
    return response.data;
  },
};

export default api;
