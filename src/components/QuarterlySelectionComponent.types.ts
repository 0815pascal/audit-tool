import { CaseAuditStatus, ClaimStatus, FindingsRecord, RatingValue, CaseType, QuarterPeriod } from '../types/types';
import { AUDIT_STATUS_ENUM } from '../enums';
import { ValidCurrency } from '../types/currencyTypes';
import { CaseAuditId, UserId, ValidYear } from '../types/brandedTypes';

/**
 * Represents an audit item used in the QuarterlySelectionComponent
 * This interface is strictly typed for better type safety
 */
export interface AuditItem {
  id: CaseAuditId;
  userId: UserId;
  status: CaseAuditStatus | AUDIT_STATUS_ENUM;
  auditor?: UserId;
  coverageAmount: number;
  isCompleted: boolean;
  claimStatus?: ClaimStatus;
  comment?: string;
  rating?: RatingValue;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;  
  quarter?: QuarterPeriod;
  year?: ValidYear;
  caseType?: CaseType;
  notifiedCurrency?: ValidCurrency;
} 