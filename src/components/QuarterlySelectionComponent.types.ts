import { CaseAuditStatus, ClaimStatus, FindingsRecord } from '../types/types';
import { AUDIT_STATUS_ENUM } from '../enums';
import { ValidCurrency } from '../types/currencyTypes';

/**
 * Represents an audit item used in the QuarterlySelectionComponent
 * This interface is compatible with both CaseAuditStatus and AUDIT_STATUS_ENUM
 * and accepts string values for broader compatibility across the codebase
 */
export interface AuditItem {
  id: string;
  userId: string;
  status: CaseAuditStatus | AUDIT_STATUS_ENUM | string;
  auditor?: string;
  coverageAmount: number;
  isCompleted: boolean;
  claimStatus?: ClaimStatus;
  comment?: string;
  rating?: string;
  specialFindings?: FindingsRecord | Record<string, boolean>;
  detailedFindings?: FindingsRecord | Record<string, boolean>;  
  quarter?: string;
  year?: number;
  caseType?: string;
  notifiedCurrency?: ValidCurrency;
} 