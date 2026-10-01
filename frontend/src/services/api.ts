/**
 * EVENTHUB Central API Client
 * Manages base URL, JWT authorization header injection,
 * automatic refresh token rotation, and error normalization.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Normalizes backend error responses into user-friendly strings.
 */
export function parseApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.data === 'object' && error.data !== null) {
      const errObj = error.data as Record<string, unknown>;
      if (typeof errObj.detail === 'string') {
        return errObj.detail;
      }
      if (Array.isArray(errObj.detail)) {
        // Pydantic validation error array
        return errObj.detail
          .map((item: { msg?: string; loc?: string[] }) => item.msg || 'Invalid field')
          .join(', ');
      }
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('eventhub_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem('eventhub_token');
      localStorage.removeItem('eventhub_refresh_token');
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('eventhub_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('eventhub_refresh_token', data.refresh_token);
      }
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('eventhub_token');

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...customConfig,
    headers: requestHeaders,
  });

  // Handle 401 and attempt automatic token refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAuthToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      requestHeaders['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...customConfig,
        headers: requestHeaders,
      });
    } else {
      // Refresh failed: broadcast unauthorized event or dispatch session expiry
      window.dispatchEvent(new CustomEvent('eventhub:session_expired'));
    }
  }

  if (!response.ok) {
    let errorData: unknown = null;
    try {
      errorData = await response.json();
    } catch {
      // not JSON
    }

    let defaultMsg = `Request failed with status ${response.status}`;
    if (response.status === 401) defaultMsg = 'Session expired. Please log in again.';
    if (response.status === 403) defaultMsg = 'You do not have permission to perform this action.';
    if (response.status === 404) defaultMsg = 'The requested resource was not found.';
    if (response.status === 409) defaultMsg = 'Resource conflict or seat no longer available.';
    if (response.status === 422) defaultMsg = 'Validation failed. Please verify input data.';

    throw new ApiError(response.status, defaultMsg, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
