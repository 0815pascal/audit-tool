/**
 * Core types for the case audit functionality.
 * 
 * These types define the domain model for auditing insurance cases.
 */

import { 
  BaseEntity, 
  BaseAuditActionPayload,
  Dictionary,
  ISODateString, 
  ClaimsStatus, 
  CaseType, 
  PolicyId, 
  CaseId, 
  UserId, 
  RatingValue, 
  FindingsRecord,
  QuarterPeriod
} from './types';

// Branded type for CaseAuditId to prevent type confusion
export type CaseAuditId = string & { readonly __brand: unique symbol };

// Utility function to check if a value is a CaseAuditId
export function isCaseAuditId(value: unknown): value is CaseAuditId {
  return typeof value === 'string';
}

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
}

// Action payload for case audit operations
export interface CaseAuditActionPayload extends BaseAuditActionPayload, CaseAuditData {
  verifier: UserId;
}

// Specific payload for verifying an audit
export interface VerifyCaseAuditPayload extends CaseAuditActionPayload {
  rating: RatingValue;
  isVerified: boolean;
}

// For backward compatibility
export interface VerifyAuditActionPayload extends CaseAuditActionPayload {
  isVerified: boolean;
}

// Summary version of CaseAudit with only essential fields
export interface CaseAuditSummary extends BaseEntity<CaseAuditId> {
  userId: UserId;
  quarter: QuarterPeriod;
  year: number;
  coverageAmount: number;
  claimsStatus: ClaimsStatus;
  comment: string;
  rating: RatingValue;
  isVerified: boolean;
  status?: CaseAuditStatus;
}

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
export function getCaseAuditData(
  state: { caseAudit: CaseAuditState },
  auditId: CaseAuditId
): StoredCaseAuditData | undefined {
  return state.caseAudit.verifiedAudits[auditId];
} 