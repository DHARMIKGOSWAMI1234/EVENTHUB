import { apiClient } from './api';
import type { SalesSummary, RatingSummary } from '../types';

export const analyticsApi = {
  getTopEvents: (limit = 10) =>
    apiClient<SalesSummary[]>('/analytics/top-events', { params: { limit } }),

  getTopRated: (limit = 10) =>
    apiClient<RatingSummary[]>('/analytics/top-rated', { params: { limit } }),
};
