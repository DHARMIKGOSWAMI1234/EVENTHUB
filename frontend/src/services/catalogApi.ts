import { apiClient } from './api';
import type { Category, Venue, VenueSeat } from '../types';

export const categoryApi = {
  getCategories: () => apiClient<Category[]>('/categories'),
  getCategory: (id: number | string) => apiClient<Category>(`/categories/${id}`),
};

export const venueApi = {
  getVenues: () => apiClient<Venue[]>('/venues'),
  getVenue: (id: number | string) => apiClient<Venue>(`/venues/${id}`),
  getVenueSeats: (venueId: number | string) => apiClient<VenueSeat[]>(`/venues/${venueId}/seats`),
};
