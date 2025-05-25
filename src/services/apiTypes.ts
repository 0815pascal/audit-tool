import { 
  ApiResponse, 
  ClaimsStatus, 
  UserRole, 
  CaseStatus, 
  FindingType, 
  FindingCategory, 
  CachedItem,
  UserId,
  CaseId,
  AuditId,
  QuarterPeriod,
  SortOrder
} from '../types';

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

// Common error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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