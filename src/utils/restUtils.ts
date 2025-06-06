import { API_BASE_PATH, PROBLEM_TYPES } from '../constants';
import type { 
  HATEOASLinks, 
  ProblemDetails, 
  EnhancedApiResponse 
} from '../types/types';

// =============================================================================
// CACHING UTILITIES (2 pts)
// =============================================================================

/**
 * Cache control strategies for different resource types
 */
export const CACHE_STRATEGIES = {
  STATIC: 'public, max-age=86400, immutable', // 24 hours for static content
  DYNAMIC: 'private, max-age=300, must-revalidate', // 5 minutes for dynamic content
  REAL_TIME: 'no-cache, no-store, must-revalidate', // No caching for real-time data
  CONDITIONAL: 'private, max-age=3600, must-revalidate' // 1 hour with conditional requests
} as const;

/**
 * Generate ETag from data (simplified hash-based approach)
 */
export const generateETag = (data: unknown): string => {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
};

/**
 * Generate Last-Modified header value
 */
export const generateLastModified = (timestamp?: Date | string): string => {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toUTCString();
};

/**
 * Generate comprehensive caching headers
 */
export interface CachingHeaders {
  'Cache-Control': string;
  'ETag': string;
  'Last-Modified': string;
  'Expires'?: string;
  'Vary'?: string;
}

export const generateCachingHeaders = (
  data: unknown,
  strategy: keyof typeof CACHE_STRATEGIES = 'DYNAMIC',
  lastModified?: Date | string,
  varyHeaders?: string[]
): CachingHeaders => {
  const headers: CachingHeaders = {
    'Cache-Control': CACHE_STRATEGIES[strategy],
    'ETag': generateETag(data),
    'Last-Modified': generateLastModified(lastModified)
  };

  // Add Expires header for static content
  if (strategy === 'STATIC') {
    const expires = new Date();
    expires.setDate(expires.getDate() + 1); // 24 hours
    headers.Expires = expires.toUTCString();
  }

  // Add Vary header for content negotiation
  if (varyHeaders && varyHeaders.length > 0) {
    headers.Vary = varyHeaders.join(', ');
  }

  return headers;
};

// =============================================================================
// PAGINATION UTILITIES (1 pt)
// =============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
  offset: number;
}

/**
 * Parse pagination parameters from URL search params
 */
export const parsePaginationParams = (searchParams: URLSearchParams): PaginationParams => {
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  return {
    page: Math.max(1, page),
    limit: Math.min(Math.max(1, limit), 100), // Cap at 100 items per page
    offset: Math.max(0, offset)
  };
};

/**
 * Calculate pagination metadata
 */
export const calculatePaginationMetadata = (
  total: number,
  page: number,
  limit: number
): PaginationMetadata => {
  const pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
    offset
  };
};

/**
 * Apply pagination to data array
 */
export const paginateData = <T>(
  data: T[],
  pagination: PaginationParams
): { data: T[]; metadata: PaginationMetadata } => {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;
  
  const paginatedData = data.slice(offset, offset + limit);
  const metadata = calculatePaginationMetadata(data.length, page, limit);

  return {
    data: paginatedData,
    metadata
  };
};

// =============================================================================
// CONTENT NEGOTIATION UTILITIES (1 pt)
// =============================================================================

export interface ContentNegotiation {
  acceptedTypes: string[];
  acceptedLanguages: string[];
  preferredType: string;
  preferredLanguage: string;
}

/**
 * Parse Accept header and determine preferred content type
 */
export const parseAcceptHeader = (acceptHeader?: string): string[] => {
  if (!acceptHeader) return ['application/json'];
  
  return acceptHeader
    .split(',')
    .map(type => type.trim().split(';')[0]) // Remove quality values for simplicity
    .filter(type => type.length > 0);
};

/**
 * Parse Accept-Language header
 */
export const parseAcceptLanguageHeader = (acceptLangHeader?: string): string[] => {
  if (!acceptLangHeader) return ['en'];
  
  return acceptLangHeader
    .split(',')
    .map(lang => lang.trim().split(';')[0]) // Remove quality values
    .filter(lang => lang.length > 0);
};

/**
 * Determine content negotiation preferences
 */
export const negotiateContent = (request: Request): ContentNegotiation => {
  const acceptHeader = request.headers.get('Accept');
  const acceptLangHeader = request.headers.get('Accept-Language');
  
  const acceptedTypes = parseAcceptHeader(acceptHeader ?? undefined);
  const acceptedLanguages = parseAcceptLanguageHeader(acceptLangHeader ?? undefined);
  
  // Supported content types (in order of preference)
  const supportedTypes = ['application/json', 'application/hal+json', 'application/problem+json'];
  const supportedLanguages = ['en', 'de', 'fr', 'it']; // Common European languages
  
  const preferredType = acceptedTypes.find(type => 
    supportedTypes.includes(type) || type === '*/*'
  ) ?? 'application/json';
  
  const preferredLanguage = acceptedLanguages.find(lang => 
    supportedLanguages.includes(lang) || lang === '*'
  ) ?? 'en';
  
  return {
    acceptedTypes,
    acceptedLanguages,
    preferredType: preferredType === '*/*' ? 'application/json' : preferredType,
    preferredLanguage: preferredLanguage === '*' ? 'en' : preferredLanguage
  };
};

/**
 * Generate appropriate Content-Type header based on negotiation
 */
export const getResponseContentType = (contentNegotiation: ContentNegotiation): string => {
  const { preferredType } = contentNegotiation;
  
  // Map preferred types to appropriate response types
  switch (preferredType) {
    case 'application/hal+json':
      return 'application/hal+json; charset=utf-8';
    case 'application/problem+json':
      return 'application/problem+json; charset=utf-8';
    default:
      return 'application/json; charset=utf-8';
  }
};

// =============================================================================
// HATEOAS Link Generation Utilities
// =============================================================================

/**
 * Generate HATEOAS links for audit resources
 */
export const generateAuditLinks = (auditId: string): HATEOASLinks => ({
  self: {
    href: `${API_BASE_PATH}/audits/${auditId}`,
    method: 'GET'
  },
  edit: {
    href: `${API_BASE_PATH}/audits/${auditId}`,
    method: 'PUT',
    title: 'Update audit'
  },
  delete: {
    href: `${API_BASE_PATH}/audits/${auditId}`,
    method: 'DELETE',
    title: 'Delete audit'
  },
  completion: {
    href: `${API_BASE_PATH}/audits/${auditId}/completion`,
    method: 'GET',
    title: 'Audit completion details'
  }
});

/**
 * Generate HATEOAS links for user resources
 */
export const generateUserLinks = (userId: string): HATEOASLinks => ({
  self: {
    href: `${API_BASE_PATH}/users/${userId}`,
    method: 'GET'
  },
  edit: {
    href: `${API_BASE_PATH}/users/${userId}`,
    method: 'PUT',
    title: 'Update user'
  }
});

/**
 * Generate HATEOAS links for audit completion resources
 */
export const generateCompletionLinks = (auditId: string): HATEOASLinks => ({
  self: {
    href: `${API_BASE_PATH}/audits/${auditId}/completion`,
    method: 'GET'
  },
  edit: {
    href: `${API_BASE_PATH}/audits/${auditId}`,
    method: 'GET',
    title: 'Parent audit'
  }
});

/**
 * Enhanced pagination HATEOAS links with metadata
 */
export const generatePaginationLinks = (
  baseUrl: string,
  currentPage: number,
  totalPages: number,
  limit: number
): HATEOASLinks => {
  const links: HATEOASLinks = {
    self: {
      href: `${baseUrl}?page=${currentPage}&limit=${limit}`,
      method: 'GET'
    }
  };

  if (currentPage > 1) {
    links.first = {
      href: `${baseUrl}?page=1&limit=${limit}`,
      method: 'GET'
    };
    links.prev = {
      href: `${baseUrl}?page=${currentPage - 1}&limit=${limit}`,
      method: 'GET'
    };
  }

  if (currentPage < totalPages) {
    links.next = {
      href: `${baseUrl}?page=${currentPage + 1}&limit=${limit}`,
      method: 'GET'
    };
    links.last = {
      href: `${baseUrl}?page=${totalPages}&limit=${limit}`,
      method: 'GET'
    };
  }

  return links;
};

// =============================================================================
// RFC 7807 Problem Details Generation
// =============================================================================

/**
 * Create RFC 7807 Problem Details for validation errors
 */
export const createValidationProblem = (
  detail: string,
  instance?: string,
  additionalFields?: Record<string, unknown>
): ProblemDetails => ({
  type: PROBLEM_TYPES.VALIDATION_ERROR,
  title: 'Validation Error',
  status: 400,
  detail,
  instance,
  ...additionalFields
});

/**
 * Create RFC 7807 Problem Details for business logic errors
 */
export const createBusinessLogicProblem = (
  detail: string,
  instance?: string,
  additionalFields?: Record<string, unknown>
): ProblemDetails => ({
  type: PROBLEM_TYPES.BUSINESS_LOGIC_ERROR,
  title: 'Business Logic Error',
  status: 422,
  detail,
  instance,
  ...additionalFields
});

/**
 * Create RFC 7807 Problem Details for not found errors
 */
export const createNotFoundProblem = (
  resourceType: string,
  resourceId: string,
  instance?: string
): ProblemDetails => ({
  type: PROBLEM_TYPES.RESOURCE_NOT_FOUND,
  title: 'Resource Not Found',
  status: 404,
  detail: `The requested ${resourceType} with ID '${resourceId}' was not found`,
  instance,
  resourceType,
  resourceId
});

/**
 * Create RFC 7807 Problem Details for conflict errors
 */
export const createConflictProblem = (
  detail: string,
  instance?: string
): ProblemDetails => ({
  type: PROBLEM_TYPES.RESOURCE_CONFLICT,
  title: 'Resource Conflict',
  status: 409,
  detail,
  instance
});

/**
 * Create RFC 7807 Problem Details for authentication errors
 */
export const createAuthenticationProblem = (
  detail: string = 'Authentication credentials are missing or invalid',
  instance?: string
): ProblemDetails => ({
  type: PROBLEM_TYPES.AUTHENTICATION_ERROR,
  title: 'Authentication Required',
  status: 401,
  detail,
  instance
});

/**
 * Create RFC 7807 Problem Details for authorization errors
 */
export const createAuthorizationProblem = (
  detail: string = 'You do not have permission to access this resource',
  instance?: string
): ProblemDetails => ({
  type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
  title: 'Insufficient Permissions',
  status: 403,
  detail,
  instance
});

/**
 * Create RFC 7807 Problem Details for internal server errors
 */
export const createInternalErrorProblem = (
  detail: string = 'An unexpected error occurred while processing your request',
  instance?: string
): ProblemDetails => ({
  type: PROBLEM_TYPES.INTERNAL_ERROR,
  title: 'Internal Server Error',
  status: 500,
  detail,
  instance
});

// =============================================================================
// Enhanced Response Creation Utilities
// =============================================================================

/**
 * Create enhanced success response with caching and pagination support
 */
export const createSuccessResponse = <T>(
  data: T,
  links?: HATEOASLinks,
  meta?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
    timestamp?: string;
    pagination?: PaginationMetadata;
  },
  message?: string
): EnhancedApiResponse<T> => ({
  success: true,
  data,
  message,
  _links: links,
  _meta: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

/**
 * Create error response with RFC 7807 Problem Details
 */
export const createErrorResponse = (
  error: string,
  problem: ProblemDetails,
  code?: number
): EnhancedApiResponse<never> => ({
  success: false,
  error,
  problem,
  _meta: {
    timestamp: new Date().toISOString(),
    errorCode: code
  }
});

// =============================================================================
// Business Logic Validation Utilities
// =============================================================================

/**
 * Validate audit completion request data
 */
export const validateAuditCompletion = (data: Record<string, unknown>): ProblemDetails[] => {
  const problems: ProblemDetails[] = [];

  if (!data.auditor || typeof data.auditor !== 'string') {
    problems.push(createValidationProblem(
      'Auditor ID is required and must be a string',
      undefined,
      { field: 'auditor' }
    ));
  }

  // Validate rating: accept valid RATING_VALUE_ENUM strings
  const validRatings = [
    'NOT_FULFILLED',
    'PARTIALLY_FULFILLED', 
    'MOSTLY_FULFILLED',
    'SUCCESSFULLY_FULFILLED',
    'EXCELLENTLY_FULFILLED',
    ''  // Allow empty rating
  ];

  if (data.rating !== undefined && (typeof data.rating !== 'string' || !validRatings.includes(data.rating))) {
    problems.push(createValidationProblem(
      `Rating must be one of: ${validRatings.filter(r => r !== '').join(', ')}, or empty`,
      undefined,
      { field: 'rating', value: data.rating }
    ));
  }

  return problems;
};

/**
 * Business rule: Users cannot audit their own cases
 */
export const canUserAuditOwnCase = (auditorId: string, caseUserId: string): boolean => {
  return auditorId !== caseUserId;
}; 