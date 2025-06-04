import { CaseAuditStatus, ClaimsStatus, FindingsRecord } from '../types/types';
import { AUDIT_STATUS_ENUM } from '../enums';
import { ValidCurrency } from '../types/currencyTypes';

/**
 * Represents an audit item used in the QuarterlySelectionComponent
 * This interface is compatible with both CaseAuditStatus and AUDIT_STATUS_ENUM
 */
export interface AuditItem {
  id: string;
  userId: string;
  status: CaseAuditStatus | AUDIT_STATUS_ENUM;
  auditor?: string;
  coverageAmount: number;
  isCompleted: boolean;
  claimsStatus?: ClaimsStatus;
  comment?: string;
  rating?: string;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;  
  quarter?: string;
  year?: number;
  caseType?: string;
  notifiedCurrency?: ValidCurrency;
} 