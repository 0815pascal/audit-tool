import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_PATH } from '../constants';

/**
 * Main API slice following RTK Query best practices:
 * - Single API slice for the main service
 * - Proper tag types for cache invalidation
 * - Consistent error handling with transformResponse
 * - Type-safe throughout
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_PATH,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Audit', 'QuarterlyAudits', 'CurrentUser', 'PreLoadedCases'],
  endpoints: () => ({}), // Empty - will use injectEndpoints pattern
});

export default api; 