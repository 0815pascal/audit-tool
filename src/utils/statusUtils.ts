/**
 * Utility functions for working with verification status enums
 * 
 * This file centralizes the mapping between CaseAuditStatus and VERIFICATION_STATUS_ENUM
 * to ensure consistency throughout the application.
 */

import { VERIFICATION_STATUS_ENUM } from '../enums';
import { CaseAuditStatus } from '../caseAuditTypes';

/**
 * Maps VERIFICATION_STATUS_ENUM to CaseAuditStatus
 */
export function mapVerificationStatusToCaseAuditStatus(status: VERIFICATION_STATUS_ENUM): CaseAuditStatus {
  switch (status) {
    case VERIFICATION_STATUS_ENUM.VERIFIED:
      return CaseAuditStatus.VERIFIED;
    case VERIFICATION_STATUS_ENUM.IN_PROGRESS:
      return CaseAuditStatus.IN_PROGRESS;
    case VERIFICATION_STATUS_ENUM.NOT_VERIFIED:
      return CaseAuditStatus.NOT_VERIFIED;
    default:
      console.warn(`Unknown verification status: ${status}. Using NOT_VERIFIED as fallback.`);
      return CaseAuditStatus.NOT_VERIFIED;
  }
}

/**
 * Maps CaseAuditStatus to VERIFICATION_STATUS_ENUM
 */
export function mapCaseAuditStatusToVerificationStatus(status: CaseAuditStatus): VERIFICATION_STATUS_ENUM {
  switch (status) {
    case CaseAuditStatus.VERIFIED:
      return VERIFICATION_STATUS_ENUM.VERIFIED;
    case CaseAuditStatus.IN_PROGRESS:
      return VERIFICATION_STATUS_ENUM.IN_PROGRESS;
    case CaseAuditStatus.NOT_VERIFIED:
      return VERIFICATION_STATUS_ENUM.NOT_VERIFIED;
    default:
      console.warn(`Unknown case audit status: ${status}. Using NOT_VERIFIED as fallback.`);
      return VERIFICATION_STATUS_ENUM.NOT_VERIFIED;
  }
}

/**
 * Safely converts a status value of either type to VERIFICATION_STATUS_ENUM
 */
export function convertToVerificationStatus(
  status: CaseAuditStatus | VERIFICATION_STATUS_ENUM | string
): VERIFICATION_STATUS_ENUM {
  // If it's already a VERIFICATION_STATUS_ENUM
  if (Object.values(VERIFICATION_STATUS_ENUM).includes(status as VERIFICATION_STATUS_ENUM)) {
    return status as VERIFICATION_STATUS_ENUM;
  }
  
  // If it's a CaseAuditStatus
  if (Object.values(CaseAuditStatus).includes(status as CaseAuditStatus)) {
    return mapCaseAuditStatusToVerificationStatus(status as CaseAuditStatus);
  }
  
  // Default fallback
  console.warn(`Unknown status value: ${status}. Using NOT_VERIFIED as fallback.`);
  return VERIFICATION_STATUS_ENUM.NOT_VERIFIED;
}

/**
 * Safely converts a status value of either type to CaseAuditStatus
 */
export function convertToCaseAuditStatus(
  status: VERIFICATION_STATUS_ENUM | CaseAuditStatus | string
): CaseAuditStatus {
  // If it's already a CaseAuditStatus
  if (Object.values(CaseAuditStatus).includes(status as CaseAuditStatus)) {
    return status as CaseAuditStatus;
  }
  
  // If it's a VERIFICATION_STATUS_ENUM
  if (Object.values(VERIFICATION_STATUS_ENUM).includes(status as VERIFICATION_STATUS_ENUM)) {
    return mapVerificationStatusToCaseAuditStatus(status as VERIFICATION_STATUS_ENUM);
  }
  
  // Default fallback
  console.warn(`Unknown status value: ${status}. Using NOT_VERIFIED as fallback.`);
  return CaseAuditStatus.NOT_VERIFIED;
} 