/**
 * Utility functions for working with audit status enums and case ID generation
 * 
 * This file provides simple conversion utilities between CaseAuditStatus and AUDIT_STATUS_ENUM.
 * Since both enums now use the same underlying string values, mapping is simplified.
 */

import {AUDIT_STATUS_ENUM} from '../enums';
import {CaseAuditStatus} from '../types';

// Import centralized function
import { generateRealisticCaseNumber as generateRealisticCaseNumberCentralized } from '../mocks/mockData';

/**
 * Generates a realistic 8-digit case number starting with 4 (like 40001912)
 * @returns A string representing an 8-digit case number
 */
export const generateRealisticCaseNumber = (): string => {
  return generateRealisticCaseNumberCentralized();
};

/**
 * Maps AUDIT_STATUS_ENUM to CaseAuditStatus
 * Since both enums use the same underlying values, this is a simple cast with validation.
 */
export function mapAuditStatusToCaseAuditStatus(status: AUDIT_STATUS_ENUM): CaseAuditStatus {
  // Since CaseAuditStatus is now just an alias for AUDIT_STATUS_ENUM, we can return the input directly
  switch (status) {
    case AUDIT_STATUS_ENUM.COMPLETED:
      return AUDIT_STATUS_ENUM.COMPLETED;
    case AUDIT_STATUS_ENUM.IN_PROGRESS:
      return AUDIT_STATUS_ENUM.IN_PROGRESS;
    case AUDIT_STATUS_ENUM.PENDING:
      return AUDIT_STATUS_ENUM.PENDING;
    default:
      return AUDIT_STATUS_ENUM.PENDING;
  }
}

/**
 * Maps CaseAuditStatus to AUDIT_STATUS_ENUM
 * Since both enums use the same underlying values, this is a simple cast with validation.
 */
export function mapCaseAuditStatusToAuditStatus(status: CaseAuditStatus): AUDIT_STATUS_ENUM {
  // Since CaseAuditStatus is now just an alias for AUDIT_STATUS_ENUM, we can return the input directly
  switch (status) {
    case AUDIT_STATUS_ENUM.COMPLETED:
      return AUDIT_STATUS_ENUM.COMPLETED;
    case AUDIT_STATUS_ENUM.IN_PROGRESS:
      return AUDIT_STATUS_ENUM.IN_PROGRESS;
    case AUDIT_STATUS_ENUM.PENDING:
      return AUDIT_STATUS_ENUM.PENDING;
    default:
      return AUDIT_STATUS_ENUM.PENDING;
  }
}

/**
 * Safely converts a status value of either type to AUDIT_STATUS_ENUM
 */
export function convertStatusToAuditStatus(
  status: CaseAuditStatus | AUDIT_STATUS_ENUM | string
): AUDIT_STATUS_ENUM {
  // Handle string inputs
  if (typeof status === 'string') {
    // If it's a CaseAuditStatus (which is now just AUDIT_STATUS_ENUM)
    if (Object.values(AUDIT_STATUS_ENUM).includes(status as AUDIT_STATUS_ENUM)) {
      return mapCaseAuditStatusToAuditStatus(status as CaseAuditStatus);
    }
  }
  
  // If it's already an AUDIT_STATUS_ENUM, return it
  return status as AUDIT_STATUS_ENUM;
}