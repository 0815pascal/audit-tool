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
 * Interface for completion API response
 */
export interface CompletionResponse {
  success: boolean;
  data: CompletionData;
} 