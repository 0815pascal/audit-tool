import { 
  CachedItem, 
  ApiResponse, 
  ApiSuccessResponse, 
  ApiErrorResponse,
  ClaimsStatus, 
  UserRole, 
  CaseStatus, 
  FindingType, 
  FindingCategory,
  UserId,
  CaseId,
  AuditId,
  QuarterPeriod,
  SortOrder
} from '../types';

/**
 * Standard cache TTL in milliseconds
 */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Common error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Check if cached data is still valid
 */
export function isCacheValid<T>(
  cache: Map<string, CachedItem<T>>, 
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

/**
 * Type-safe generic cache for API responses or other data
 */
export class TypedCache<T> {
  private cache: Map<string, CachedItem<T>>;
  private ttl: number;
  
  /**
   * Create a new typed cache
   * @param ttl Cache time-to-live in milliseconds
   */
  constructor(ttl: number = DEFAULT_CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  /**
   * Set cache item with current timestamp
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get cache item if valid, otherwise return null
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist or is expired
    if (!item || Date.now() - item.timestamp > this.ttl) {
      return null;
    }
    
    return item.data;
  }
  
  /**
   * Check if cache has a valid item for key
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && (Date.now() - item.timestamp <= this.ttl);
  }
  
  /**
   * Delete an item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get all valid cache keys
   */
  keys(): string[] {
    const validKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (Date.now() - item.timestamp <= this.ttl) {
        validKeys.push(key);
      }
    });
    
    return validKeys;
  }
  
  /**
   * Get all valid cache entries
   */
  entries(): { key: string; data: T }[] {
    const validEntries: { key: string; data: T }[] = [];
    
    this.cache.forEach((item, key) => {
      if (Date.now() - item.timestamp <= this.ttl) {
        validEntries.push({ key, data: item.data });
      }
    });
    
    return validEntries;
  }
  
  /**
   * Get the cache size (number of valid entries)
   */
  size(): number {
    return this.keys().length;
  }
}

// ===== API TYPES (merged from apiTypes.ts) =====

// Cache-related branded types for stronger typings
export type CacheKey = string & { readonly __brand: 'CacheKey' };

export function createCacheKey(prefix: string, identifier: string): CacheKey {
  return `${prefix}-${identifier}` as CacheKey;
}

// Finding ID branded type
export type FindingId = number & { readonly __brand: 'FindingId' };

export function createFindingId(id: number): FindingId {
  return id as FindingId;
}

// Create an API cache type for consistent usage
export type ApiCache<T> = Map<CacheKey, CachedItem<T>>;

// Data types for API responses
export interface ClaimOwner {
  userId: UserId;
  role: UserRole;
}

/**
 * Represents a case object from the external system that can be audited
 * 
 * A CaseObj is the central entity being audited in the system. It contains:
 * 1. Case identification (caseNumber)
 * 2. Information about who owns the case (claimOwner)
 * 3. Status and financial information (claimsStatus, coverageAmount, caseStatus)
 * 4. Notification date for quarter calculation (notificationDate)
 * 5. Currency information for proper formatting (notifiedCurrency)
 * 
 * The CaseObj is included in AuditRecord and eventually becomes part of a Dossier
 * in the internal application data model.
 */
export interface CaseObj {
  caseNumber: CaseId;
  claimOwner: ClaimOwner;
  claimsStatus: ClaimsStatus;
  coverageAmount: number;
  caseStatus: CaseStatus;
  notificationDate: string; // Date when the case was notified, used for quarter calculation
  notifiedCurrency: string; // Currency code for the case (e.g., CHF, EUR, USD)
}

export interface Auditor {
  userId: UserId;
  role: UserRole;
}

/**
 * Represents an audit record from the external system
 * 
 * This is the raw audit data as returned by the API before it's transformed
 * into a Dossier for internal application use. An AuditRecord contains:
 * 
 * 1. Basic audit metadata (auditId, quarter)
 * 2. Reference to the case being audited (caseObj)
 * 3. Information about who performed the audit (auditor)
 * 
 * In the application flow:
 * - AuditRecords are fetched from the API
 * - They are transformed into Dossiers for verification workflow
 * - Dossiers are then stored in the application state
 */
export interface AuditRecord {
  auditId: AuditId;
  quarter: QuarterPeriod;
  caseObj?: CaseObj;
  auditor: Auditor;
  isAkoReviewed: boolean;
  dossierRisk?: number; 
}

export interface Finding {
  findingId: FindingId;
  type: FindingType;
  description: string;
  category?: FindingCategory;
}

// Payload for creating or updating an audit
export interface AuditPayload {
  quarter: QuarterPeriod; 
  caseObj: { 
    caseNumber: CaseId;
    claimsStatus?: ClaimsStatus;
    coverageAmount?: number;
    caseStatus?: CaseStatus;
  }; 
  auditor: { 
    userId: UserId;
    role?: UserRole;
  };
  findings?: Array<Omit<Finding, 'findingId'>>;
  isAkoReviewed?: boolean;
}

// Response types
export type AuditResponse = ApiResponse<AuditRecord[]>;
export type CaseResponse = ApiResponse<CaseObj[]>;

// Pagination types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API query parameters
export interface ApiQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filter?: Record<string, string | number | boolean>;
}

// Auth-related types
export interface AuthToken {
  token: string;
  expiresAt: number;
}

export interface AuthUser {
  id: UserId;
  name: string;
  role: UserRole;
} 