/**
 * Utility functions for working with verification status enums and case ID generation
 * 
 * This file provides simple conversion utilities between CaseAuditStatus and VERIFICATION_STATUS_ENUM.
 * Since both enums now use the same underlying string values, mapping is simplified.
 */

import { VERIFICATION_STATUS_ENUM } from '../enums';
import { CaseAuditStatus } from '../types';

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
 * Maps VERIFICATION_STATUS_ENUM to CaseAuditStatus
 * Since both enums use the same underlying values, this is a simple cast with validation.
 */
export function mapVerificationStatusToCaseAuditStatus(status: VERIFICATION_STATUS_ENUM): CaseAuditStatus {
  // Direct mapping since values are now aligned
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
 * Since both enums use the same underlying values, this is a simple cast with validation.
 */
export function mapCaseAuditStatusToVerificationStatus(status: CaseAuditStatus): VERIFICATION_STATUS_ENUM {
  // Direct mapping since values are now aligned
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