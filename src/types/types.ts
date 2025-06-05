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
  claimsStatus: ClaimsStatus;
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
  claimsStatus: ClaimsStatus;
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
export type ClaimsStatus = CLAIMS_STATUS_ENUM;

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

// API response handling
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;



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
  claimsStatus?: string;
  auditor?: string;
  comment?: string;
  rating?: string;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;
  isCompleted?: boolean;
  quarter?: string; // Quarter calculated from notification date
  notifiedCurrency?: string; // Currency code for the case (e.g., CHF, EUR, USD)
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
 * Represents a single audit item in API responses and Redux actions
 * Used for both userQuarterlyAudits and previousQuarterRandomAudits
 */
interface AuditItem {
  id: string;
  userId: string;
  status: string;
  auditor: string;
  coverageAmount: number;
  isCompleted: boolean;
  claimsStatus: string;
  quarter: string;
  notifiedCurrency?: ValidCurrency;
  caseType: string;
  comment?: string;
  rating?: string;
  specialFindings?: Record<string, boolean>;
  detailedFindings?: Record<string, boolean>;
}

/**
 * Payload for storeQuarterlyAudits Redux action
 */
export interface StoreQuarterlyAuditsPayload {
  audits: AuditItem[];
}

/**
 * Represents a case item for quarter display (simplified view)
 */
interface QuarterCaseItem {
  id: string;
  userId: string;
  coverageAmount: number;
  claimsStatus: string;
  quarter: string;
  notifiedCurrency?: ValidCurrency;
}

/**
 * Payload for storeAllCasesForQuarter Redux action
 */
export interface StoreAllCasesForQuarterPayload {
  quarter: string;
  cases: QuarterCaseItem[];
}

/**
 * Represents a pre-loaded case with full audit data
 */
interface PreLoadedCaseItem {
  id: string;
  userId: string;
  auditor: string;
  isCompleted: boolean;
  comment: string;
  rating: string;
  specialFindings: Record<string, boolean>;
  detailedFindings: Record<string, boolean>;
  coverageAmount: number;
  claimsStatus: string;
  quarter: string;
  notifiedCurrency: ValidCurrency;
}

/**
 * Payload for loadPreLoadedCases Redux action
 */
export type LoadPreLoadedCasesPayload = PreLoadedCaseItem[];

// =============================================
// API Response Types
// =============================================

/**
 * Response structure for quarterly audits API endpoints
 */
export interface QuarterlyAuditsData {
  quarterKey: string;
  userQuarterlyAudits: AuditItem[];
  previousQuarterRandomAudits: AuditItem[];
  lastSelectionDate: string;
}

/**
 * Complete API response for quarterly audits
 */
export interface QuarterlyAuditsResponse {
  success: boolean;
  data: QuarterlyAuditsData;
}

/**
 * Response structure for audit completion operations
 */
export interface AuditCompletionResponse {
  success: boolean;
  auditId: string;
  status: string;
  completionDate?: string;
  message?: string;
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
  auditId: string;
  auditor: string;
  rating: string;
  comment: string;
  specialFindings: Record<string, boolean>;
  detailedFindings: Record<string, boolean>;
  status: string;
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
  department: string;
}

/**
 * Interface for quarterly completion status tracking
 */
interface QuarterlyCompletionStatus {
  completed: boolean;
  lastCompleted?: string;
}

/**
 * Interface for the audit UI slice state
 */
export interface AuditUIState {
  currentUserId: string;
  selectedQuarter: QuarterPeriod | null;
  filteredYear: number;
  auditData: Record<string, StoredCaseAuditData>;
  userQuarterlyStatus: Record<string, Record<string, QuarterlyCompletionStatus>>;
  userRoles: Record<string, UserRoleInfo>;
  loading: boolean;
  error: string | null;
}

/**
 * Payload for updating audit status
 */
export interface UpdateAuditStatusPayload {
  auditId: string;
  status: AUDIT_STATUS_ENUM;
  userId: string;
}

/**
 * Payload for setting user role
 */
export interface SetUserRolePayload {
  userId: string;
  role: UserRole;
  department: string;
}

/**
 * RTK Query response for pre-loaded cases endpoint
 */
export interface PreLoadedCase {
  id: string;
  userId: string;
  auditor: string;
  isCompleted: boolean;
  comment: string;
  rating: string;
  specialFindings: FindingsRecord;
  detailedFindings: FindingsRecord;
  coverageAmount: number;
  claimsStatus: string;
  quarter: string;
  notifiedCurrency: ValidCurrency;
}

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
  auditId: string;
  findingType: string;
  findingDescription: string;
}

/**
 * Return type for quarterly audits selector
 */
export interface QuarterlyAuditsSelector {
  userQuarterlyAudits: Array<StoredCaseAuditData & { id: string }>;
  previousQuarterRandomAudits: Array<StoredCaseAuditData & { id: string }>;
  quarterDisplayCases: Array<StoredCaseAuditData & { id: string }>;
  preLoadedCases: Array<StoredCaseAuditData & { id: string }>;
  lastSelectionDate: string | null;
}