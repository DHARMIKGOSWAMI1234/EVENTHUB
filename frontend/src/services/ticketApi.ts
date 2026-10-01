// frontend/src/services/ticketApi.ts
import { apiClient } from './api';
import type { Ticket, TicketValidateResponse, TicketValidationResponse, PaginatedResponse } from '../types';

export const ticketApi = {
  getMyTickets: (params?: { page?: number; page_size?: number; limit?: number; offset?: number; status?: string } | number) => {
    let p = 1;
    let ps = 20;
    let status: string | undefined;

    if (typeof params === 'number') {
      p = params;
    } else if (params) {
      if (params.page !== undefined) p = params.page;
      if (params.page_size !== undefined) ps = params.page_size;
      else if (params.limit !== undefined) ps = params.limit;
      if (params.offset !== undefined && params.limit) {
        p = Math.floor(params.offset / params.limit) + 1;
      }
      status = params.status;
    }

    return apiClient<PaginatedResponse<Ticket>>('/tickets', {
      params: { page: p, page_size: ps, status },
    });
  },

  getTicket: (ticketId: number | string) =>
    apiClient<Ticket>(`/tickets/${ticketId}`),

  validateTicket: async (
    ticketInput: number | string | { ticket_id?: number | string; ticket_code?: string; qr_token?: string }
  ): Promise<TicketValidationResponse> => {
    let targetId: number | string = 1;
    if (typeof ticketInput === 'number' || typeof ticketInput === 'string') {
      targetId = ticketInput;
    } else if (ticketInput.ticket_id) {
      targetId = ticketInput.ticket_id;
    } else if (ticketInput.ticket_code) {
      // If code starts with a number or contains numbers, extract
      const match = ticketInput.ticket_code.match(/\d+/);
      if (match) targetId = match[0];
      else targetId = ticketInput.ticket_code;
    }

    try {
      const res = await apiClient<TicketValidateResponse>(`/tickets/${targetId}/validate`, {
        method: 'POST',
      });
      return {
        valid: res.current_status === 'USED',
        status: res.current_status,
        message: res.message || 'Ticket admission approved.',
        ticket: {
          id: res.id,
          booking_id: 0,
          ticket_type_id: 0,
          ticket_code: res.ticket_code,
          qr_token: '',
          status: 'USED',
          checked_in_at: res.validated_at,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed';
      return {
        valid: false,
        status: msg.includes('already been used') ? 'ALREADY USED' : 'INVALID',
        message: msg,
      };
    }
  },
};
