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
  SPECIAL_FINDING_ENUM,
  type Department} from '../enums';

// Import branded types from separate file
import type {
  CaseAuditId,
  UserId,
  CaseId,
  PolicyId,
  ValidYear
} from './brandedTypes';

// CaseAudit types moved from caseAuditTypes.ts

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

// Define common type for verification findings as union of specific finding types
export type FindingsRecord = {
  [K in DetailedFindingType | SpecialFindingType]: boolean;
};

// Date representation - can be used instead of string for dates
export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}${string}` | `${number}-${number}-${number}`;

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

export interface ToastData {
  message: string;
  type: ToastType;
}

// Context provider related types
export type ContextProviderProps = PropsWithChildren;