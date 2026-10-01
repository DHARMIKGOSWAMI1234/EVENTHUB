import { apiClient } from './api';
import type { User, AuthTokens, MessageResponse } from '../types';

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: { full_name: string; email: string; password: string; phone?: string }) =>
    apiClient<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => apiClient<User>('/auth/me'),

  logout: () =>
    apiClient<MessageResponse>('/auth/logout', {
      method: 'POST',
    }),

  refresh: (refreshToken: string) =>
    apiClient<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
};
