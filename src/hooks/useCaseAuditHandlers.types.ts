import { ClaimStatus, FindingsRecord } from '../types/types';

/**
 * Interface for external audit data with optional properties
 * Used when converting external audit format to our CaseAudit type
 */
export interface ExternalAuditData {
  id: string;
  userId?: string;
  status?: string;
  auditor?: string;
  coverageAmount?: number;
  claimStatus?: ClaimStatus;
  comment?: string;
  rating?: string;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;
  isCompleted?: boolean;
  [key: string]: unknown; // Allow additional properties
} 