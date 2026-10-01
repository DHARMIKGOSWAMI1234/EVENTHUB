// frontend/src/services/eventApi.ts
import { apiClient } from './api';
import type {
  EventItem,
  EventDetail,
  EventAvailability,
  EventSeat,
  TicketType,
  Review,
  PaginatedResponse,
} from '../types';

export interface EventFilterParams {
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
  status?: string;
  category_id?: number;
  organizer_id?: number;
  venue_id?: number;
  start_date?: string;
  end_date?: string;
  date_from?: string;
  date_to?: string;
  seating_mode?: string;
  search?: string;
}

export const eventApi = {
  getEvents: (params?: EventFilterParams) => {
    const queryParams: Record<string, string | number | boolean | undefined | null> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.page_size !== undefined) queryParams.page_size = params.page_size;
      else if (params.limit !== undefined) queryParams.page_size = params.limit;
      if (params.offset !== undefined && params.limit) {
        queryParams.page = Math.floor(params.offset / params.limit) + 1;
      }
      if (params.status) queryParams.status = params.status;
      if (params.category_id) queryParams.category_id = params.category_id;
      if (params.venue_id) queryParams.venue_id = params.venue_id;
      if (params.organizer_id) queryParams.organizer_id = params.organizer_id;
      if (params.seating_mode) queryParams.seating_mode = params.seating_mode;
      if (params.search) queryParams.search = params.search;
      if (params.start_date || params.date_from) {
        queryParams.date_from = params.start_date || params.date_from;
      }
      if (params.end_date || params.date_to) {
        queryParams.date_to = params.end_date || params.date_to;
      }
    }
    return apiClient<PaginatedResponse<EventItem>>('/events', {
      params: queryParams,
    });
  },

  getEvent: (eventId: number | string) =>
    apiClient<EventDetail>(`/events/${eventId}`),

  getAvailability: (eventId: number | string) =>
    apiClient<EventAvailability>(`/events/${eventId}/availability`),

  getSeats: (eventId: number | string) =>
    apiClient<EventSeat[]>(`/events/${eventId}/seats`),

  getTicketTypes: (eventId: number | string) =>
    apiClient<TicketType[]>(`/events/${eventId}/ticket-types`),

  getReviews: async (eventId: number | string, page = 1, pageSize = 20) => {
    const res = await apiClient<PaginatedResponse<Review>>(`/events/${eventId}/reviews`, {
      params: { page, page_size: pageSize },
    });
    return res.items || [];
  },
};
