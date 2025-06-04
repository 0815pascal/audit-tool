import type { 
  CachedItem,
  FindingType, 
  FindingCategory,
  QuarterPeriod
} from '../types/types';
import type { ValidCurrency } from '../types/currencyTypes';
import type { 
  CacheKey, 
  FindingId,
  CaseAuditId,
  UserId,
  CaseId
} from '../types/brandedTypes';
import { USER_ROLE_ENUM, CLAIMS_STATUS_ENUM, CASE_STATUS_ENUM } from '../enums';

// Type aliases for easier use in this file
type UserRole = USER_ROLE_ENUM;
type ClaimsStatus = CLAIMS_STATUS_ENUM;
type CaseStatus = CASE_STATUS_ENUM;

// Cache-related branded types for stronger typings
export const createCacheKey = (prefix: string, identifier: string): CacheKey => 
  `${prefix}-${identifier}` as CacheKey;

// Finding ID branded type
export const createFindingId = (id: number): FindingId => id as FindingId;

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
  notifiedCurrency: ValidCurrency; // Currency code for the case (e.g., CHF, EUR, USD)
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
 * - They are transformed into Dossiers for audit workflow
 * - Dossiers are then stored in the application state
 */
export interface AuditRecord {
  auditId: CaseAuditId;
  quarter: QuarterPeriod;
  caseObj?: CaseObj;
  auditor: Auditor;
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
}