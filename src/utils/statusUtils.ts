/**
 * Utility functions for working with audit status enums and case ID generation
 * 
 * This file provides simple conversion utilities between CaseAuditStatus and AUDIT_STATUS_ENUM.
 * Since both enums now use the same underlying string values, mapping is simplified.
 */

import { AUDIT_STATUS_ENUM } from '../enums';
import { CaseAuditStatus } from '../types/types';

/**
 * Generates a realistic 8-digit case number starting with 4 (like 40001912)
 * @returns A string representing an 8-digit case number
 */
export const generateRealisticCaseNumber = (): string => {
  // Generate a realistic 8-digit case number starting with 4 (like 40001912)
  const baseNumber = 40000000; // Start from 40000000
  const randomSuffix = Math.floor(Math.random() * 99999); // Add up to 99999
  return (baseNumber + randomSuffix).toString();
};

/**
 * Maps AUDIT_STATUS_ENUM to CaseAuditStatus
 * Since both enums use the same underlying values, this is a simple cast with validation.
 */
export function mapAuditStatusToCaseAuditStatus(status: AUDIT_STATUS_ENUM): CaseAuditStatus {
  // Direct mapping since values are now aligned
  switch (status) {
    case AUDIT_STATUS_ENUM.COMPLETED:
      return CaseAuditStatus.COMPLETED;
    case AUDIT_STATUS_ENUM.IN_PROGRESS:
      return CaseAuditStatus.IN_PROGRESS;
    case AUDIT_STATUS_ENUM.PENDING:
      return CaseAuditStatus.PENDING;
    default:
      console.warn(`Unknown audit status: ${status}. Using PENDING as fallback.`);
      return CaseAuditStatus.PENDING;
  }
}

/**
 * Maps CaseAuditStatus to AUDIT_STATUS_ENUM
 * Since both enums use the same underlying values, this is a simple cast with validation.
 */
export function mapCaseAuditStatusToAuditStatus(status: CaseAuditStatus): AUDIT_STATUS_ENUM {
  // Direct mapping since values are now aligned
  switch (status) {
    case CaseAuditStatus.COMPLETED:
      return AUDIT_STATUS_ENUM.COMPLETED;
    case CaseAuditStatus.IN_PROGRESS:
      return AUDIT_STATUS_ENUM.IN_PROGRESS;
    case CaseAuditStatus.PENDING:
      return AUDIT_STATUS_ENUM.PENDING;
    default:
      console.warn(`Unknown case audit status: ${status}. Using PENDING as fallback.`);
      return AUDIT_STATUS_ENUM.PENDING;
  }
}

/**
 * Safely converts a status value of either type to AUDIT_STATUS_ENUM
 */
export function convertToAuditStatus(
  status: CaseAuditStatus | AUDIT_STATUS_ENUM | string
): AUDIT_STATUS_ENUM {
  // If it's already an AUDIT_STATUS_ENUM
  if (Object.values(AUDIT_STATUS_ENUM).includes(status as AUDIT_STATUS_ENUM)) {
    return status as AUDIT_STATUS_ENUM;
  }
  
  // If it's a CaseAuditStatus
  if (Object.values(CaseAuditStatus).includes(status as CaseAuditStatus)) {
    return mapCaseAuditStatusToAuditStatus(status as CaseAuditStatus);
  }
  
  // Default fallback
  console.warn(`Unknown status value: ${status}. Using PENDING as fallback.`);
  return AUDIT_STATUS_ENUM.PENDING;
}