import {
  CLAIMS_STATUS_ENUM,
  USER_ROLE_ENUM,
  CASE_TYPE_ENUM,
  RATING_VALUE_ENUM,
  DETAILED_FINDING_ENUM,
  SPECIAL_FINDING_ENUM,
  AUDIT_STATUS_ENUM,
  type Department} from '../enums';

// Import branded types from separate file
import type {
  CaseAuditId,
  UserId,
  CaseId,
  PolicyId,
  ValidYear
} from './brandedTypes';

// Import currency types
import type { ValidCurrency } from './currencyTypes';

// =============================================================================
// REST API Enhancement Types for 100% Compliance
// =============================================================================

// HATEOAS (Hypermedia as the Engine of Application State) support
export interface HATEOASLink {
  href: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  type?: string;
  title?: string;
}

export interface HATEOASLinks {
  self?: HATEOASLink;
  next?: HATEOASLink;
  prev?: HATEOASLink;
  first?: HATEOASLink;
  last?: HATEOASLink;
  edit?: HATEOASLink;
  delete?: HATEOASLink;
  completion?: HATEOASLink;
  auditor?: HATEOASLink;
  user?: HATEOASLink;
  related?: HATEOASLink[];
}

// RFC 7807 Problem Details for HTTP APIs
export interface ProblemDetails {
  type: string;          // URI reference that identifies the problem type
  title: string;         // Human-readable summary of the problem type
  status: number;        // HTTP status code
  detail?: string;       // Human-readable explanation specific to this occurrence
  instance?: string;     // URI reference that identifies the specific occurrence
  violatedRule?: string; // Business rule that was violated
  field?: string;        // Field that caused validation error
  resourceType?: string; // Type of resource that was not found
  resourceId?: string;   // ID of resource that was not found
}

// Enhanced API response with HATEOAS support
interface EnhancedApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  _links?: HATEOASLinks;
  _meta?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
    timestamp?: string;
  };
}

// Enhanced error response with RFC 7807 Problem Details
interface EnhancedApiErrorResponse {
  success: false;
  error: string;          // Legacy error message for backward compatibility
  code?: number;          // Legacy error code for backward compatibility
  problem?: ProblemDetails; // RFC 7807 Problem Details
  _meta?: {
    timestamp?: string;
    errorCode?: number;
  };
}

export type EnhancedApiResponse<T> = EnhancedApiSuccessResponse<T> | EnhancedApiErrorResponse;

// Enhanced status codes for comprehensive REST compliance
export enum RestStatusCode {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  NOT_MODIFIED = 304,
  
  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  CONFLICT = 409,
  GONE = 410,
  PRECONDITION_FAILED = 412,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// =============================================================================
// End REST API Enhancement Types
// =============================================================================

// CaseAudit types moved from caseAuditTypes.ts

// Use centralized AUDIT_STATUS_ENUM instead of duplicate enum
export type CaseAuditStatus = AUDIT_STATUS_ENUM;

// Core audit step interface
interface CaseAuditStep {
  id: string;
  isCompleted: boolean;
  isIncorrect: boolean;
  comment: string;
}

// Standard case audit data structure
export interface CaseAuditData {
  comment: string;
  rating: RatingValue;
  specialFindings: FindingsRecord;
  detailedFindings: FindingsRecord;
}

// Extended storage version with additional metadata
export interface StoredCaseAuditData extends CaseAuditData {
  userId: UserId;
  completionDate: ISODateString | null;
  auditor: UserId;
  isCompleted: boolean;
  isIncorrect: boolean;
  status: CaseAuditStatus;
  steps: Record<string, CaseAuditStep>;
  quarter: string;
  year: number;
  caseType: CaseType;
  coverageAmount: number;
  claimStatus: ClaimStatus;
  dossierName: string;
  lastUpdated?: string;
  notifiedCurrency?: ValidCurrency; // Currency code for the case (e.g., CHF, EUR, USD)
}

// Action payload for case audit operations
export interface CaseAuditActionPayload extends BaseAuditActionPayload, CaseAuditData {
  auditor: UserId;
}

// Summary version of CaseAudit with only essential fields
// Core case audit data without audit-specific fields
interface CaseAuditCore extends BaseEntity<CaseAuditId> {
  userId: UserId;
  date: ISODateString;
  clientName: string;
  policyNumber: PolicyId;
  caseNumber: CaseId;
  dossierRisk: number;
  dossierName: string;
  totalAmount: number;
  coverageAmount: number;
  isCompleted: boolean;
  isSpecialist: boolean;
  claimStatus: ClaimStatus;
  quarter: QuarterPeriod;
  year: number;
  caseType: CaseType;
}

// Complete case audit entity with full data
export interface CaseAudit extends CaseAuditCore, CaseAuditData {
  auditor: UserId;
  status?: CaseAuditStatus;
  notificationDate?: string; // Date when the case was notified, used for quarter calculation
  notifiedCurrency?: ValidCurrency; // Currency code for the case (e.g., CHF, EUR, USD)
}



// Base types as string literals (enum-like) - Keep only meaningful aliases
export type UserRole = USER_ROLE_ENUM;
export type CaseType = CASE_TYPE_ENUM;

// Types using enums for stronger typing - Keep only ones that are used
export type ClaimStatus = CLAIMS_STATUS_ENUM;

export type RatingValue = RATING_VALUE_ENUM | '';
export type FindingType = DETAILED_FINDING_ENUM | SPECIAL_FINDING_ENUM;

// Define detailed and special findings as separate subsets for stronger typing
export type DetailedFindingsRecord = Record<DETAILED_FINDING_ENUM, boolean>;
export type SpecialFindingsRecord = Record<SPECIAL_FINDING_ENUM, boolean>;

// Define common type for audit findings as union of specific finding types
export type FindingsRecord = {
  [K in DETAILED_FINDING_ENUM | SPECIAL_FINDING_ENUM]: boolean;
};

// Date representation - can be used instead of string for dates
export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}${string}` | `${number}-${number}-${number}`;



// Generic API response caching
export interface CachedItem<T> {
  data: T;
  timestamp: number;
}

// API response handling - use EnhancedApiResponse for new code
export type ApiResponse<T> = EnhancedApiResponse<T>;



// Base entity interface for all main data objects
interface BaseEntity<T = string> {
  id: T;
}

// Common action payload types
interface BaseAuditActionPayload {
  auditId: CaseAuditId;
  userId: UserId;
}



// Quarter period representation (e.g., "Q2-2023")
export type QuarterPeriod = `Q${QuarterNumber}-${number}`;

// More strongly typed Quarter structure
export type QuarterNumber = 1 | 2 | 3 | 4;

export interface Quarter {
  quarter: QuarterNumber;
  year: ValidYear; // Use ValidYear for stronger type safety
}

// Type for audit quarterly selection payloads
export interface AuditForSelection extends BaseEntity<CaseAuditId> {
  auditId: CaseAuditId; // Explicitly include auditId for selection operations
  userId: string;
  status?: AUDIT_STATUS_ENUM;
  coverageAmount: number;
  claimStatus?: ClaimStatus;
  auditor?: string;
  comment?: string;
  rating?: RatingValue;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;
  isCompleted?: boolean;
  quarter?: QuarterPeriod; // Quarter calculated from notification date
  notifiedCurrency?: ValidCurrency; // Currency code for the case (e.g., CHF, EUR, USD)
}

// Type for user audit selection with userId
export interface UserAuditForSelection extends AuditForSelection {
  userId: UserId;
}

// Common user fields extracted into a reusable interface
interface BaseUserFields {
  displayName: string;
  department: Department;
  authorities: UserRole;
  enabled: boolean;
}

// User definition using composition with BaseUserFields
export interface User extends BaseEntity<UserId>, BaseUserFields {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  initials?: string;
  username?: string;
  email?: string;
}

// Generic select option type
export interface SelectOption<T = string> {
  value: T;
  label: string;
}

// Type for rating dropdown options - using the SelectOption generic
export type RatingOption = SelectOption<RatingValue>;





// =============================================
// Redux Action Payload Types
// =============================================

/**
 * Payload for storeQuarterlyAudits Redux action
 */
export interface StoreQuarterlyAuditsPayload {
  audits: import('../components/QuarterlySelectionComponent.types').AuditItem[];
}

/**
 * Represents a case item for quarter display (simplified view)
 */
interface QuarterCaseItem {
  id: string;
  userId: string;
  coverageAmount: number;
  claimStatus: ClaimStatus;
  quarter: QuarterPeriod;
  notifiedCurrency?: ValidCurrency;
}

/**
 * Payload for storeAllCasesForQuarter Redux action
 */
export interface StoreAllCasesForQuarterPayload {
  quarter: QuarterPeriod;
  cases: QuarterCaseItem[];
}

/**
 * Represents a pre-loaded case with full audit data
 * (Consolidated interface - removing duplicate)
 */
export interface PreLoadedCase {
  id: string;
  userId: string;
  auditor: string;
  isCompleted: boolean;
  comment: string;
  rating: RatingValue;
  specialFindings: FindingsRecord;
  detailedFindings: FindingsRecord;
  coverageAmount: number;
  claimStatus: ClaimStatus;
  quarter: QuarterPeriod;
  notifiedCurrency: ValidCurrency;
}

/**
 * Payload for loadPreLoadedCases Redux action
 */
export type LoadPreLoadedCasesPayload = PreLoadedCase[];

// =============================================
// API Response Types
// =============================================

/**
 * Response structure for quarterly audits API endpoints
 */
export interface QuarterlyAuditsData {
  quarterKey: QuarterPeriod;
  userQuarterlyAudits: import('../components/QuarterlySelectionComponent.types').AuditItem[];
  previousQuarterRandomAudits: import('../components/QuarterlySelectionComponent.types').AuditItem[];
  lastSelectionDate: ISODateString;
}

/**
 * Complete API response for quarterly audits
 */
export interface QuarterlyAuditsResponse {
  success: boolean;
  data: QuarterlyAuditsData;
  _links?: HATEOASLinks;
  _meta?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
    timestamp?: string;
  };
}

/**
 * Response structure for audit completion operations
 */
export interface AuditCompletionResponse {
  success: boolean;
  auditId: CaseAuditId;
  status: CaseAuditStatus;
  completionDate?: ISODateString;
  message?: string;
  _links?: HATEOASLinks;
  _meta?: {
    timestamp?: ISODateString;
  };
}

/**
 * Response structure for current user API
 */
export interface CurrentUserResponse {
  success: boolean;
  data: User;
}

// =============================================
// RTK Query Mutation Parameters
// =============================================

/**
 * Parameters for audit completion mutations
 */
export interface AuditCompletionParams {
  auditId: CaseAuditId;
  auditor: UserId;
  rating: RatingValue;
  comment: string;
  specialFindings: FindingsRecord;
  detailedFindings: FindingsRecord;
  status: CaseAuditStatus;
  isCompleted: boolean;
}

// =============================================
// Redux UI State and Action Payload Types
// =============================================

/**
 * Interface for user role information stored in Redux
 */
interface UserRoleInfo {
  role: UserRole;
  department: Department;
}

/**
 * Interface for quarterly completion status tracking
 */
interface QuarterlyCompletionStatus {
  completed: boolean;
  lastCompleted?: ISODateString;
}

/**
 * Interface for the audit UI slice state
 */
export interface AuditUIState {
  currentUserId: UserId;
  selectedQuarter: QuarterPeriod | null;
  filteredYear: ValidYear;
  auditData: Record<CaseAuditId, StoredCaseAuditData>;
  userQuarterlyStatus: Record<UserId, Record<QuarterPeriod, QuarterlyCompletionStatus>>;
  userRoles: Record<UserId, UserRoleInfo>;
  loading: boolean;
  error: string | null;
}

/**
 * Payload for updating audit status
 */
export interface UpdateAuditStatusPayload {
  auditId: CaseAuditId;
  status: AUDIT_STATUS_ENUM;
  userId: UserId;
}

/**
 * Payload for setting user roles
 */
export interface SetUserRolePayload {
  userId: UserId;
  role: UserRole;
  department: Department;
}

// PreLoadedCase interface consolidated above to avoid duplication

/**
 * API response wrapper for pre-loaded cases
 */
export interface PreLoadedCasesResponse {
  data?: PreLoadedCase[];
}

/**
 * RTK Query mutation parameters for add audit finding
 */
export interface AddAuditFindingParams {
  auditId: CaseAuditId;
  findingType: FindingType;
  findingDescription: string;
}

/**
 * Selector interface for quarterly audits data
 */
export interface QuarterlyAuditsSelector {
  userQuarterlyAudits: Array<StoredCaseAuditData & { id: CaseAuditId }>;
  previousQuarterRandomAudits: Array<StoredCaseAuditData & { id: CaseAuditId }>;
  quarterDisplayCases: Array<StoredCaseAuditData & { id: CaseAuditId }>;
  preLoadedCases: Array<StoredCaseAuditData & { id: CaseAuditId }>;
  lastSelectionDate: ISODateString | null;
}

