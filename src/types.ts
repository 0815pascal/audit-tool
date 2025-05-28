import {
  FINDING_CATEGORY,
  TOAST_TYPE,
  ACTION_STATUS_ENUM,
  CASE_STATUS_ENUM,
  CLAIMS_STATUS_ENUM,
  VERIFICATION_STATUS_ENUM,
  USER_ROLE_ENUM,
  CASE_TYPE_ENUM,
  RATING_VALUE_ENUM,
  DETAILED_FINDING_ENUM,
  SPECIAL_FINDING_ENUM} from './enums';

// CaseAudit types moved from caseAuditTypes.ts

// Branded type for CaseAuditId to prevent type confusion
export type CaseAuditId = string & { readonly __brand: unique symbol };

// Utility function to check if a value is a CaseAuditId
// Create a CaseAuditId from a string
export function createCaseAuditId(id: string): CaseAuditId {
  return id as CaseAuditId;
}

// Ensure a value is a CaseAuditId
export function ensureCaseAuditId(id: string | CaseAuditId): CaseAuditId {
  return typeof id === 'string' ? createCaseAuditId(id) : id;
}

// Enum for CaseAuditStatus
export enum CaseAuditStatus {
  NOT_VERIFIED = 'not_verified',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified'
}

// Core audit step interface
export interface CaseAuditStep {
  id: string;
  isVerified: boolean;
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
  verificationDate: ISODateString | null;
  verifier: UserId;
  isVerified: boolean;
  isIncorrect: boolean;
  status: CaseAuditStatus;
  steps: Record<string, CaseAuditStep>;
  // Additional fields for compatibility with StoredVerificationData
  quarter: string;
  year: number;
  caseType: CaseType;
  coverageAmount: number;
  claimsStatus: ClaimsStatus;
  dossierName: string;
  isAkoReviewed?: boolean;
  lastUpdated?: string;
  notifiedCurrency?: string; // Currency code for the case (e.g., CHF, EUR, USD)
}

// Action payload for case audit operations
export interface CaseAuditActionPayload extends BaseAuditActionPayload, CaseAuditData {
  verifier: UserId;
}

// Specific payload for verifying an audit
// For backward compatibility
export interface VerifyAuditActionPayload extends CaseAuditActionPayload {
  isVerified: boolean;
}

// Summary version of CaseAudit with only essential fields
// Core case audit data without audit-specific fields
export interface CaseAuditCore extends BaseEntity<CaseAuditId> {
  userId: UserId;
  date: ISODateString;
  clientName: string;
  policyNumber: PolicyId;
  caseNumber: CaseId;
  dossierRisk: number;
  dossierName: string;
  totalAmount: number;
  coverageAmount: number;
  isVerified: boolean;
  isAkoReviewed: boolean;
  isSpecialist: boolean;
  claimsStatus: ClaimsStatus;
  quarter: QuarterPeriod;
  year: number;
  caseType: CaseType;
}

// Complete case audit entity with full data
export interface CaseAudit extends CaseAuditCore, CaseAuditData {
  verifier: UserId;
  status?: CaseAuditStatus;
  notificationDate?: string; // Date when the case was notified, used for quarter calculation
  notifiedCurrency?: string; // Currency code for the case (e.g., CHF, EUR, USD)
}

// Redux state for case audits
export interface CaseAuditState {
  currentUserId: UserId;
  verifiedAudits: Dictionary<StoredCaseAuditData>;
  userQuarterlyStatus: {
    [userId: string]: {
      [quarterKey: string]: {
        verified: boolean;
        lastVerified?: string;
      }
    }
  };
  quarterlySelection: Dictionary<{
    quarterKey: string;
    lastSelectionDate?: string;
    userQuarterlyAudits: CaseAuditId[];
    previousQuarterRandomAudits: CaseAuditId[];
  }>;
  userRoles: Dictionary<{
    role: string;
    department: string;
  }>;
  loading?: boolean;
  error?: string | null;
}

// Utility function to get case audit data from state
// Base types as string literals (enum-like)
export type UserRole = USER_ROLE_ENUM;
export type CaseType = CASE_TYPE_ENUM;

// Types using enums for stronger typing
export type ClaimsStatus = CLAIMS_STATUS_ENUM;
export type CaseStatus = CASE_STATUS_ENUM;
export type VerificationStatus = VERIFICATION_STATUS_ENUM;
export type ActionStatus = ACTION_STATUS_ENUM;
export type FindingCategory = FINDING_CATEGORY;
export type ToastType = TOAST_TYPE;
export type RatingValue = RATING_VALUE_ENUM | '';
export type DetailedFindingType = DETAILED_FINDING_ENUM;
export type SpecialFindingType = SPECIAL_FINDING_ENUM;
export type FindingType = DetailedFindingType | SpecialFindingType;
// Define detailed and special findings as separate subsets for stronger typing
export type DetailedFindingsRecord = Record<DetailedFindingType, boolean>;
export type SpecialFindingsRecord = Record<SpecialFindingType, boolean>;

// Step interface for verification/calculation steps
// Define common type for verification findings as union of specific finding types
export type FindingsRecord = {
  [K in DetailedFindingType | SpecialFindingType]: boolean;
};

// Date representation - can be used instead of string for dates
export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}${string}` | `${number}-${number}-${number}`;
/**
 * Create a date string in ISO format with type safety
 */
export function createISODateString(date: Date = new Date()): ISODateString {
  return date.toISOString() as ISODateString;
}
// State management types
export interface AsyncState<T, E = string> {
  data: T | null;
  status: ActionStatus;
  error: E | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}
// Generic API response caching
export interface CachedItem<T> {
  data: T;
  timestamp: number;
}
// API response handling
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Utility types for common patterns - renamed for clarity
export type Dictionary<T> = Record<string, T>;
// Type conversion utilities
// Type to convert string enum to union type
// HTTP-related types
// Type-safe URL paths
// Higher-order types for working with generics
// Function-related types
// Standardized verification data structure
// Base entity interface for all main data objects
export interface BaseEntity<T = string> {
  id: T;
}

// Common action payload types
export interface BaseAuditActionPayload {
  auditId: CaseAuditId;
  userId: UserId;
}
export interface StatusUpdatePayload extends BaseAuditActionPayload {
  status: CaseAuditStatus;
}

// Common types for user quarterly status
// Create type-safe Record types for records by key
// Quarter period representation (e.g., "Q2-2023")
export type QuarterPeriod = `Q${QuarterNumber}-${number}`;

/**
 * Type guard to check if a string is a valid QuarterPeriod
 */
export function isQuarterPeriod(value: string): value is QuarterPeriod {
  if (!/^Q[1-4]-\d{4}$/.test(value)) {
    return false;
  }
  
  const [quarterPart, yearPart] = value.split('-');
  const quarterNum = parseInt(quarterPart.substring(1));
  const year = parseInt(yearPart);
  
  return (
    quarterNum >= 1 && 
    quarterNum <= 4 && 
    year >= 2000 && 
    year <= 2100
  );
}
// More strongly typed Quarter structure
export type QuarterNumber = 1 | 2 | 3 | 4;

// Ensure year values are reasonable
export type ValidYear = number & { readonly brand: unique symbol };
export function isValidYear(year: number): year is ValidYear {
  return year >= 2000 && year <= 2100;
}
export function createValidYear(year: number): ValidYear {
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}. Must be between 2000 and 2100.`);
  }
  return year;
}

export interface Quarter {
  quarter: QuarterNumber;
  year: ValidYear; // Use ValidYear for stronger type safety
}

// Type for quarterly selection data
// Type for audit quarterly selection payloads
export interface AuditForSelection extends BaseEntity<CaseAuditId> {
  auditId: CaseAuditId; // Explicitly include auditId for selection operations
  userId: string;
  status?: VERIFICATION_STATUS_ENUM;
  coverageAmount: number;
  claimsStatus?: string;
  verifier?: string;
  comment?: string;
  rating?: string;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;
  isVerified?: boolean;
  isAkoReviewed?: boolean;
  quarter?: string; // Quarter calculated from notification date
  year?: number; // Year calculated from notification date
  notifiedCurrency?: string; // Currency code for the case (e.g., CHF, EUR, USD)
}

// Type for user audit selection with userId
export interface UserAuditForSelection extends AuditForSelection {
  userId: UserId;
}

// Common user fields extracted into a reusable interface
export interface BaseUserFields {
  name: string;
  department: string;
  role: UserRole;
  isActive: boolean;
}

// Type for user role info - use the relevant fields from BaseUserFields
// Branded ID types for better type safety
export type UserId = string & { readonly __brand: unique symbol };
export type CaseId = number & { readonly __brand: unique symbol };
export type PolicyId = number & { readonly __brand: unique symbol };

// Type guard functions for branded types
// Helper functions for creating branded types
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createCaseId(id: number): CaseId {
  return id as CaseId;
}

export function createPolicyId(id: number): PolicyId {
  return id as PolicyId;
}

// Generic utility function to safely convert a string or number to a branded ID type
// Improved shorthand helper functions for common ID types
export function ensureUserId(id: string | UserId): UserId {
  return typeof id === 'string' ? createUserId(id) : id;
}
// User definition using composition with BaseUserFields
export interface User extends BaseEntity<UserId>, BaseUserFields {
  middleName?: string;
  initials?: string;
}
// Generic select option type
export interface SelectOption<T = string> {
  value: T;
  label: string;
}

// Type for rating dropdown options - using the SelectOption generic
export type RatingOption = SelectOption<RatingValue>;

// Common React component prop types
import type { ReactNode, HTMLAttributes } from 'react';

// Custom prop types for consistent component APIs
export interface PropsWithChildren {
  children: ReactNode;
}

export interface PropsWithClassName {
  className?: string;
}
// Generic component props type helper with HTML attributes
export type ComponentProps<T = HTMLDivElement> = HTMLAttributes<T> & PropsWithClassName;

// Generic props with children helper
// Type-safe helper functions
export const createEmptyFindings = (): FindingsRecord => {
  return {
    [DETAILED_FINDING_ENUM.FACTS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.TERMS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.COVERAGE_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED]: false,
    [DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED]: false,
    [DETAILED_FINDING_ENUM.COLLECTION_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.RECOURSE_WRONG]: false,
    [DETAILED_FINDING_ENUM.COST_RISK_WRONG]: false,
    [DETAILED_FINDING_ENUM.BPR_WRONG]: false,
    [DETAILED_FINDING_ENUM.COMMUNICATION_POOR]: false,
    [SPECIAL_FINDING_ENUM.FEEDBACK]: false,
    [SPECIAL_FINDING_ENUM.COMMUNICATION]: false,
    [SPECIAL_FINDING_ENUM.RECOURSE]: false,
    [SPECIAL_FINDING_ENUM.NEGOTIATION]: false,
    [SPECIAL_FINDING_ENUM.PERFECT_TIMING]: false
  };
};

// Helper to create just detailed findings
export const createEmptyDetailedFindings = (): DetailedFindingsRecord => {
  return {
    [DETAILED_FINDING_ENUM.FACTS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.TERMS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.COVERAGE_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED]: false,
    [DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED]: false,
    [DETAILED_FINDING_ENUM.COLLECTION_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.RECOURSE_WRONG]: false,
    [DETAILED_FINDING_ENUM.COST_RISK_WRONG]: false,
    [DETAILED_FINDING_ENUM.BPR_WRONG]: false,
    [DETAILED_FINDING_ENUM.COMMUNICATION_POOR]: false
  };
};

// Helper to create just special findings
export const createEmptySpecialFindings = (): SpecialFindingsRecord => {
  return {
    [SPECIAL_FINDING_ENUM.FEEDBACK]: false,
    [SPECIAL_FINDING_ENUM.COMMUNICATION]: false,
    [SPECIAL_FINDING_ENUM.RECOURSE]: false,
    [SPECIAL_FINDING_ENUM.NEGOTIATION]: false,
    [SPECIAL_FINDING_ENUM.PERFECT_TIMING]: false
  };
};

// Helper to format a quarter period (Q1-2023 format)
export function formatQuarterPeriod(quarter: QuarterNumber, year: number): QuarterPeriod {
  return `Q${quarter}-${year}`;
}

// Type guard to check if a finding is a detailed finding
// Type guard to check if a finding is a special finding
export interface ToastData {
  message: string;
  type: ToastType;
}

// Context provider related types
export type ContextProviderProps = PropsWithChildren;