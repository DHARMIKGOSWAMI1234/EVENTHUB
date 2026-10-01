// frontend/src/services/userActionsApi.ts
import { apiClient } from './api';
import type { User, Review, Favorite, Notification, MessageResponse } from '../types';

export const userApi = {
  getProfile: () => apiClient<User>('/users/me'),
  getMe: () => apiClient<User>('/users/me'),
  updateProfile: (payload: { full_name?: string; phone?: string | null }) =>
    apiClient<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getUserById: (userId: number | string) => apiClient<User>(`/users/${userId}`),
};

export const reviewApi = {
  submitReview: (eventId: number | string, payload: { rating: number; comment?: string }) =>
    apiClient<Review>(`/events/${eventId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createReview: (eventId: number | string, payload: { rating: number; comment?: string }) =>
    apiClient<Review>(`/events/${eventId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateReview: (reviewId: number | string, payload: { rating?: number; comment?: string }) =>
    apiClient<Review>(`/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteReview: (reviewId: number | string) =>
    apiClient<MessageResponse>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    }),
};

export const favoriteApi = {
  getFavorites: () => apiClient<Favorite[]>('/favorites'),
  addFavorite: (eventId: number | string) =>
    apiClient<Favorite>(`/favorites/${eventId}`, {
      method: 'POST',
    }),
  removeFavorite: (eventId: number | string) =>
    apiClient<MessageResponse>(`/favorites/${eventId}`, {
      method: 'DELETE',
    }),
};

export const notificationApi = {
  getNotifications: async (params?: { limit?: number; offset?: number }) => {
    const list = await apiClient<Notification[]>('/notifications');
    let items = list;
    if (params?.limit) {
      items = items.slice(0, params.limit);
    }
    return {
      items,
      total: list.length,
    };
  },
  listNotifications: () => apiClient<Notification[]>('/notifications'),
  markRead: (id: number | string) =>
    apiClient<Notification>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllRead: () =>
    apiClient<MessageResponse>('/notifications/read-all', {
      method: 'PATCH',
    }),
};
