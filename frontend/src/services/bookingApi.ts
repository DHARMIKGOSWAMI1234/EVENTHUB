// frontend/src/services/bookingApi.ts
import { apiClient } from './api';
import type {
  Booking,
  BookingDetail,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaginatedResponse,
} from '../types';

export interface CreateBookingPayload {
  event_id: number;
  ticket_type_id?: number;
  event_seat_id?: number | null;
  quantity?: number;
  payment_method?: PaymentMethod;
  discount_amount?: string | number;
  items?: { ticket_type_id: number; event_seat_id?: number; quantity: number }[];
}

export const bookingApi = {
  createBooking: (payload: CreateBookingPayload) => {
    // If structured items array is provided, adapt to backend BookingCreateRequest
    let ticket_type_id = payload.ticket_type_id;
    let event_seat_id = payload.event_seat_id;
    let quantity = payload.quantity ?? 1;

    if (payload.items && payload.items.length > 0) {
      ticket_type_id = payload.items[0].ticket_type_id;
      event_seat_id = payload.items[0].event_seat_id;
      quantity = payload.items[0].quantity;
    }

    return apiClient<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        event_id: payload.event_id,
        ticket_type_id,
        event_seat_id,
        quantity,
        payment_method: payload.payment_method || 'UPI',
        discount_amount: payload.discount_amount || '0.00',
      }),
    });
  },

  getMyBookings: (params?: {
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
    return apiClient<PaginatedResponse<Booking>>('/bookings', {
      params: { page: p, page_size: ps, status: params?.status },
    });
  },

  getBooking: (bookingId: number | string) =>
    apiClient<BookingDetail>(`/bookings/${bookingId}`),

  cancelBooking: (bookingId: number | string) =>
    apiClient<Booking>(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    }),

  expireBooking: (bookingId: number | string) =>
    apiClient<Booking>(`/bookings/${bookingId}/expire`, {
      method: 'POST',
    }),

  getPayment: (bookingId: number | string) =>
    apiClient<Payment>(`/bookings/${bookingId}/payment`),

  simulatePayment: (
    bookingId: number | string,
    payload: {
      payment_method: PaymentMethod;
      status?: PaymentStatus;
      simulate_status?: 'SUCCESS' | 'FAILED';
      gateway_response?: Record<string, unknown>;
    }
  ) => {
    let simStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    if (payload.simulate_status) {
      simStatus = payload.simulate_status;
    } else if (payload.status === 'FAILED') {
      simStatus = 'FAILED';
    }

    return apiClient<Payment>(`/bookings/${bookingId}/payment/simulate`, {
      method: 'POST',
      body: JSON.stringify({
        payment_method: payload.payment_method,
        simulate_status: simStatus,
      }),
    });
  },
};
