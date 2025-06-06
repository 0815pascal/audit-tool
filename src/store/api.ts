import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_BASE_PATH } from '../constants';
import type { RootState } from './index';

// Type for potential auth state (may not exist in all applications)
interface AuthState {
  token?: string;
}

// Extended root state type that may include auth
interface ExtendedRootState extends RootState {
  auth?: AuthState;
}

/**
 * Enhanced fetchBaseQuery with retry logic and proper timeout handling
 */
const baseQueryWithRetry = retry(
  fetchBaseQuery({
    baseUrl: API_BASE_PATH,
    timeout: 10000, // 10 second timeout
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      
      // Add authentication if available
      const state = getState() as ExtendedRootState;
      const token = state.auth?.token; // Auth state may not exist yet
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  {
    maxRetries: 2, // Retry failed requests up to 2 times
  }
);

/**
 * Main API slice following RTK Query best practices:
 * - Single API slice for the main service
 * - Proper tag types for cache invalidation
 * - Enhanced error handling with transformErrorResponse
 * - Retry logic and timeout handling
 * - Type-safe throughout
 * - Optimized cache management
 */
const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  // Keep unused data in cache for 5 minutes (300 seconds) - RTK Query best practice
  keepUnusedDataFor: 300,
  // Enable automatic refetching on focus/reconnect (RTK Query best practice)
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['User', 'Audit', 'QuarterlyAudits', 'CurrentUser', 'PreLoadedCases'],
  endpoints: () => ({}), // Empty - will use injectEndpoints pattern
});

/**
 * Enhanced error handling utility for consistent error processing
 */
export const isRTKQueryError = (error: unknown): error is FetchBaseQueryError => {
  return typeof error === 'object' && error != null && 'status' in error;
};

/**
 * Extract error message from RTK Query error
 */
export const getErrorMessage = (error: unknown): string => {
  if (isRTKQueryError(error)) {
    if ('error' in error) {
      return error.error;
    }
    if ('data' in error && error.data) {
      const data = error.data as { message?: string; error?: string };
      return data.message ?? data.error ?? `HTTP ${error.status}`;
    }
    return `HTTP ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api; 