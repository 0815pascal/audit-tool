import { 
  ClaimsStatus, 
  CaseStatus, 
  UserId, 
  CaseId, 
  QuarterPeriod,
  FindingType,
  CaseType,
  RatingValue,
  DetailedFindingsRecord,
  SpecialFindingsRecord,
  ISODateString,
  UserRole
} from '../types';

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
  isVerified: boolean;
  claimsStatus: ClaimsStatus;
  coverageAmount: number;
  verifier: string;
  comment: string;
  rating: RatingValue;
  specialFindings: SpecialFindingsRecord;
  detailedFindings: DetailedFindingsRecord;
  quarter: string;
  year: number;
  isAkoReviewed: boolean;
  isSpecialist: boolean;
  caseType: CaseType;
  notifiedCurrency: string;
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
  caseStatus: CaseStatus;
  notificationDate: string;
  notifiedCurrency: string;
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
  isAkoReviewed: boolean;
}

// API response format for finding endpoints
export interface ApiFindingResponse {
  findingId: number;
  type: FindingType | string;
  description: string;
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
    caseStatus?: CaseStatus;
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