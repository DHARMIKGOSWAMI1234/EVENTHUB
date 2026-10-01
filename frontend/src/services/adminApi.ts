// frontend/src/services/adminApi.ts
import { apiClient } from './api';
import { venueApi } from './catalogApi';
import type {
  User,
  UserRole,
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  Venue,
  VenueCreateRequest,
  VenueUpdateRequest,
  VenueSeat,
  VenueSeatCreateRequest,
  AdminOverview,
  SalesSummary,
  OccupancySummary,
  OrganizerRevenue,
  MonthlyBooking,
  RatingSummary,
  AuditLog,
  PaginatedResponse,
  MessageResponse,
} from '../types';

export const adminApi = {
  getUsers: (params?: {
    page?: number;
    page_size?: number;
    limit?: number;
    offset?: number;
    role?: string;
    is_active?: boolean;
    search?: string;
  }) => {
    const queryParams: Record<string, string | number | boolean | undefined | null> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.page_size !== undefined) queryParams.page_size = params.page_size;
      else if (params.limit !== undefined) queryParams.page_size = params.limit;
      if (params.offset !== undefined && params.limit) {
        queryParams.page = Math.floor(params.offset / params.limit) + 1;
      }
      if (params.role) queryParams.role = params.role;
      if (params.is_active !== undefined) queryParams.is_active = params.is_active;
      if (params.search) queryParams.search = params.search;
    }
    return apiClient<PaginatedResponse<User>>('/admin/users', { params: queryParams });
  },

  updateUserStatus: (userId: number | string, isActive: boolean) =>
    apiClient<User>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),

  activateUser: (userId: number | string) =>
    apiClient<User>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: true }),
    }),

  deactivateUser: (userId: number | string) =>
    apiClient<User>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
    }),

  updateUserRole: (userId: number | string, role: UserRole) =>
    apiClient<User>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  changeUserRole: (userId: number | string, role: UserRole) =>
    apiClient<User>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  createCategory: (payload: CategoryCreateRequest) =>
    apiClient<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name || payload.category_name,
        description: payload.description,
      }),
    }),

  updateCategory: (id: number | string, payload: CategoryUpdateRequest) =>
    apiClient<Category>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: payload.name || payload.category_name,
        description: payload.description,
      }),
    }),

  deleteCategory: (id: number | string) =>
    apiClient<MessageResponse>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  createVenue: (payload: VenueCreateRequest) =>
    apiClient<Venue>('/admin/venues', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateVenue: (id: number | string, payload: VenueUpdateRequest) =>
    apiClient<Venue>(`/admin/venues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteVenue: (id: number | string) =>
    apiClient<MessageResponse>(`/admin/venues/${id}`, {
      method: 'DELETE',
    }),

  getVenueSeats: (venueId: number | string) => venueApi.getVenueSeats(venueId),

  addVenueSeat: (venueId: number | string, payload: VenueSeatCreateRequest) =>
    apiClient<VenueSeat>(`/admin/venues/${venueId}/seats`, {
      method: 'POST',
      body: JSON.stringify({
        section_name: payload.section_name || payload.section,
        row_label: payload.row_label || payload.row_number,
        seat_number: Number(payload.seat_number),
        seat_label: payload.seat_label,
        seat_type: payload.seat_type || 'STANDARD',
      }),
    }),

  getOverview: () => apiClient<AdminOverview>('/admin/analytics/overview'),
  getEventSales: (limit = 50) => apiClient<SalesSummary[]>('/admin/analytics/events', { params: { limit } }),
  getSalesSummary: () => apiClient<SalesSummary[]>('/admin/analytics/events'),
  getOccupancySummary: () => apiClient<OccupancySummary[]>('/admin/analytics/occupancy'),
  getRevenue: (limit = 50) => apiClient<OrganizerRevenue[]>('/admin/analytics/revenue', { params: { limit } }),
  getOrganizerRevenue: () => apiClient<OrganizerRevenue[]>('/admin/analytics/revenue'),
  getBookingsTrends: () => apiClient<MonthlyBooking[]>('/admin/analytics/bookings'),
  getMonthlyBookings: () => apiClient<MonthlyBooking[]>('/admin/analytics/bookings'),
  getRatings: (limit = 50) => apiClient<RatingSummary[]>('/admin/analytics/ratings', { params: { limit } }),
  getRatingSummary: () => apiClient<RatingSummary[]>('/admin/analytics/ratings'),

  getAuditLogs: (params?: {
    page?: number;
    page_size?: number;
    limit?: number;
    offset?: number;
    entity_name?: string;
    entity_type?: string;
    entity_id?: number;
    action?: string;
  }) => {
    const queryParams: Record<string, string | number | boolean | undefined | null> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.page_size !== undefined) queryParams.page_size = params.page_size;
      else if (params.limit !== undefined) queryParams.page_size = params.limit;
      if (params.offset !== undefined && params.limit) {
        queryParams.page = Math.floor(params.offset / params.limit) + 1;
      }
      if (params.action) queryParams.action = params.action;
      if (params.entity_name || params.entity_type) {
        queryParams.entity_type = params.entity_name || params.entity_type;
      }
    }
    return apiClient<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params: queryParams });
  },

  releaseExpiredHolds: () =>
    apiClient<{ released_count: number; message: string }>('/admin/maintenance/release-expired-holds', {
      method: 'POST',
    }),
};
