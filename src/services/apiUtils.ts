import { ApiCache, CachedItem, ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { ApiError } from './apiTypes';

/**
 * Standard cache TTL in milliseconds
 */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if cached data is still valid
 */
export function isCacheValid<T>(
  cache: ApiCache<T>, 
  cacheKey: string, 
  ttl: number = DEFAULT_CACHE_TTL
): boolean {
  const cachedItem = cache.get(cacheKey);
  if (cachedItem) {
    const { timestamp } = cachedItem;
    return Date.now() - timestamp < ttl;
  }
  return false;
}

/**
 * Create a cached item with current timestamp
 */
export function createCacheItem<T>(data: T): CachedItem<T> {
  return {
    data,
    timestamp: Date.now()
  };
}

/**
 * Create a success API response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse(error: string, code?: number): ApiErrorResponse {
  return {
    success: false,
    error,
    code
  };
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as ApiError).code === 'string' &&
    typeof (error as ApiError).message === 'string'
  );
}

/**
 * Create a properly typed API error
 */
export function createApiError(
  code: string, 
  message: string, 
  details?: Record<string, unknown>
): ApiError {
  return { code, message, details };
}

/**
 * Type-safe error handler that converts any error to ApiError
 */
export function handleApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return createApiError(
      'UNKNOWN_ERROR',
      error.message,
      { originalError: error.name, stack: error.stack }
    );
  }
  
  // For primitive error values or unexpected error types
  return createApiError(
    'UNEXPECTED_ERROR',
    typeof error === 'string' ? error : 'An unexpected error occurred',
    { originalError: error }
  );
}

/**
 * Type-safe function to extract error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return typeof error === 'string' ? error : 'An unexpected error occurred';
}

/**
 * Type-safe timeout promise
 */
export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(createApiError('TIMEOUT', `Operation timed out after ${ms}ms`));
    }, ms);
    
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(handleApiError(error));
      });
  });
}

/**
 * Type-safe retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>, 
  options: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, shouldRetry = () => true } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry based on the error
      if (!shouldRetry(error)) {
        throw handleApiError(error);
      }
      
      // If this was the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw handleApiError(error);
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should be unreachable, but TypeScript doesn't know that
  throw handleApiError(lastError);
}

/**
 * Type guard to check if response is a success response
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error response
 */
export function isErrorResponse<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
} 