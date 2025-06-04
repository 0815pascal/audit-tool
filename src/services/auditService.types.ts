import { CaseAuditId, UserId } from '../types/brandedTypes';
import { AUDIT_STATUS_ENUM } from '../enums';

/**
 * Interface for audit completion data
 */
export interface CompletionData {
  auditorId: number;
  status: AUDIT_STATUS_ENUM;
  rating?: string;
  comment?: string;
  isCompleted?: boolean;
}

/**
 * Interface for update completion request payload
 */
export interface UpdateCompletionRequest {
  auditId: CaseAuditId;
  auditor: UserId;
  status: AUDIT_STATUS_ENUM;
  auditorId: number;
  rating?: string;
  comment?: string;
}

/**
 * Interface for completion API response
 */
export interface CompletionResponse {
  success: boolean;
  data: CompletionData;
} 