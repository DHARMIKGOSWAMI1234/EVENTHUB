// frontend/src/services/organizerApi.ts
import { apiClient } from './api';
import type {
  OrganizerProfile,
  EventItem,
  EventDetail,
  TicketType,
  SalesSummary,
  OccupancySummary,
  OrganizerRevenue,
  PaginatedResponse,
  MessageResponse,
  SeatingMode,
} from '../types';

export interface CreateEventPayload {
  category_id: number;
  venue_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time?: string | null;
  event_date?: string;
  seating_mode: SeatingMode;
  banner_image_url?: string | null;
}

export interface UpdateEventPayload {
  category_id?: number;
  venue_id?: number;
  title?: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string | null;
  banner_image_url?: string | null;
}

export interface CreateTicketTypePayload {
  name: string;
  description?: string | null;
  price: string | number;
  capacity: number;
}

export const organizerApi = {
  getProfile: () => apiClient<OrganizerProfile>('/organizer/profile'),
  getOrganizerProfile: () => apiClient<OrganizerProfile>('/organizer/profile'),

  updateProfile: (payload: Partial<OrganizerProfile>) =>
    apiClient<OrganizerProfile>('/organizer/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateOrganizerProfile: (payload: Partial<OrganizerProfile>) =>
    apiClient<OrganizerProfile>('/organizer/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getEvents: (page = 1, pageSize = 20, status?: string) =>
    apiClient<PaginatedResponse<EventItem>>('/organizer/events', {
      params: { page, page_size: pageSize, status },
    }),

  getMyEvents: (params?: {
    page?: number;
    page_size?: number;
    limit?: number;
    offset?: number;
    status?: string;
  }) => {
    let p = 1;
    let ps = 20;
    if (params) {
      if (params.page !== undefined) p = params.page;
      if (params.page_size !== undefined) ps = params.page_size;
      else if (params.limit !== undefined) ps = params.limit;
      if (params.offset !== undefined && params.limit) {
        p = Math.floor(params.offset / params.limit) + 1;
      }
    }
    return apiClient<PaginatedResponse<EventItem>>('/organizer/events', {
      params: { page: p, page_size: ps, status: params?.status },
    });
  },

  getEvent: (eventId: number | string) =>
    apiClient<EventDetail>(`/organizer/events/${eventId}`),

  createEvent: (payload: CreateEventPayload) => {
    // Ensure event_date and time are properly formatted for backend
    let dateStr = payload.event_date;
    let timeStr = payload.start_time;
    if (payload.start_time.includes('T')) {
      const parts = payload.start_time.split('T');
      dateStr = parts[0];
      timeStr = parts[1].slice(0, 8);
    }
    let endTimeStr = payload.end_time;
    if (endTimeStr && endTimeStr.includes('T')) {
      endTimeStr = endTimeStr.split('T')[1].slice(0, 8);
    }

    // Backend seating_mode check constraint: GENERAL_ADMISSION or RESERVED_SEATING
    let mode = payload.seating_mode;
    if (mode === 'RESERVED') mode = 'RESERVED_SEATING';
    if (mode === 'GENERAL') mode = 'GENERAL_ADMISSION';

    return apiClient<EventItem>('/organizer/events', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        event_date: dateStr,
        start_time: timeStr,
        end_time: endTimeStr,
        seating_mode: mode,
      }),
    });
  },

  updateEvent: (eventId: number | string, payload: UpdateEventPayload) =>
    apiClient<EventItem>(`/organizer/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  publishEvent: (eventId: number | string) =>
    apiClient<EventItem>(`/organizer/events/${eventId}/publish`, {
      method: 'POST',
    }),

  cancelEvent: (eventId: number | string) =>
    apiClient<EventItem>(`/organizer/events/${eventId}/cancel`, {
      method: 'POST',
    }),

  deleteEvent: (eventId: number | string) =>
    apiClient<MessageResponse>(`/organizer/events/${eventId}`, {
      method: 'DELETE',
    }),
  deleteDraftEvent: (eventId: number | string) =>
    apiClient<MessageResponse>(`/organizer/events/${eventId}`, {
      method: 'DELETE',
    }),

  createTicketType: (eventId: number | string, payload: CreateTicketTypePayload) =>
    apiClient<TicketType>(`/organizer/events/${eventId}/ticket-types`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTicketType: (
    ticketTypeId: number | string,
    payload: { name?: string; description?: string; price?: string | number; capacity?: number; is_active?: boolean }
  ) =>
    apiClient<TicketType>(`/organizer/ticket-types/${ticketTypeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteTicketType: (ticketTypeId: number | string) =>
    apiClient<MessageResponse>(`/organizer/ticket-types/${ticketTypeId}`, {
      method: 'DELETE',
    }),

  getAnalyticsOverview: () =>
    apiClient<OrganizerRevenue[]>('/organizer/analytics/overview'),
  getOrganizerRevenue: () =>
    apiClient<OrganizerRevenue[]>('/organizer/analytics/overview'),

  getEventSalesAnalytics: (eventId?: number | string) => {
    if (eventId) {
      return apiClient<SalesSummary[]>(`/organizer/analytics/events/${eventId}`);
    }
    return apiClient<SalesSummary[]>('/admin/analytics/events');
  },
  getOrganizerSales: (eventId?: number | string) => {
    if (eventId) {
      return apiClient<SalesSummary[]>(`/organizer/analytics/events/${eventId}`);
    }
    return apiClient<SalesSummary[]>('/admin/analytics/events');
  },

  getOrganizerOccupancy: () =>
    apiClient<OccupancySummary[]>('/admin/analytics/occupancy'),
};
