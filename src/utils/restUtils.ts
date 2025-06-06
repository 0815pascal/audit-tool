import { API_BASE_PATH, PROBLEM_TYPES } from '../constants';
import type { 
  HATEOASLinks, 
  ProblemDetails, 
  EnhancedApiResponse 
} from '../types/types';

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
 * Generate pagination HATEOAS links
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
// Enhanced Response Generation
// =============================================================================

/**
 * Create enhanced success response with HATEOAS support
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
 * Create enhanced error response with RFC 7807 Problem Details
 */
export const createErrorResponse = (
  error: string,
  problem: ProblemDetails,
  code?: number
): EnhancedApiResponse<never> => ({
  success: false,
  error,
  code,
  problem
});

/**
 * Validate request payload and return validation problems
 */
export const validateAuditCompletion = (data: Record<string, unknown>): ProblemDetails[] => {
  const problems: ProblemDetails[] = [];

  if (!data.auditor) {
    problems.push(createValidationProblem(
      'Auditor field is required',
      undefined,
      { field: 'auditor' }
    ));
  }

  if (!data.rating) {
    problems.push(createValidationProblem(
      'Rating field is required',
      undefined,
      { field: 'rating' }
    ));
  }

  if (!data.comment || (typeof data.comment === 'string' && data.comment.trim().length === 0)) {
    problems.push(createValidationProblem(
      'Comment field is required and cannot be empty',
      undefined,
      { field: 'comment' }
    ));
  }

  return problems;
};

/**
 * Check if user can audit their own cases (business logic)
 */
export const canUserAuditOwnCase = (auditorId: string, caseUserId: string): boolean => {
  return auditorId !== caseUserId;
}; 