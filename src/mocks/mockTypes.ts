import { 
  ClaimsStatus, 
  QuarterPeriod,
  CaseType,
  RatingValue,
  DetailedFindingsRecord,
  SpecialFindingsRecord,
  ISODateString,
  UserRole
} from '../types/types';
import { ValidCurrency } from '../types/currencyTypes';
import {
  UserId,
  CaseId
} from '../types/brandedTypes';
import { CASE_STATUS_ENUM } from '../enums';

/**
 * Mock-specific types for MSW handlers and test data
 */

// Complete mock case data structure used in MSW handlers
export interface MockCaseData extends Record<string, unknown> {
  id: string;
  userId: string;
  notificationDate: ISODateString;
  clientName: string;
  policyNumber: number;
  caseNumber: number;
  dossierRisk: number;
  dossierName: string;
  totalAmount: number;
  isCompleted: boolean;
  claimsStatus: ClaimsStatus;
  coverageAmount: number;
  auditor: string;
  comment: string;
  rating: RatingValue;
  specialFindings: SpecialFindingsRecord;
  detailedFindings: DetailedFindingsRecord;
  quarter: string;
  year: number;
  isSpecialist: boolean;
  caseType: CaseType;
  notifiedCurrency: ValidCurrency;
}

// API response format for case selection endpoints
export interface ApiCaseResponse {
  caseNumber: CaseId;
  claimOwner: {
    userId: UserId | number;
    role: UserRole;
  };
  claimsStatus: ClaimsStatus;
  coverageAmount: number;
  caseStatus: CASE_STATUS_ENUM;
  notificationDate: string;
  notifiedCurrency: ValidCurrency;
}

// API response format for audit endpoints
export interface ApiAuditResponse {
  auditId: number;
  quarter: QuarterPeriod;
  caseObj: ApiCaseResponse;
  auditor: {
    userId: UserId | number;
    role: UserRole;
  };
}



// API request payload structure for audit endpoints
export interface ApiAuditRequestPayload {
  quarter?: string;
  caseObj?: {
    caseNumber?: string | number;
    claimOwner?: {
      userId?: string | number;
      role?: UserRole;
    };
    claimsStatus?: ClaimsStatus;
    coverageAmount?: number;
    caseStatus?: CASE_STATUS_ENUM;
    notifiedCurrency?: string;
    [key: string]: unknown;
  };
  auditor?: {
    userId?: string | number;
    role?: UserRole;
    [key: string]: unknown;
  };
  type?: string;
  description?: string;
} 