// Export all services and utility functions for easier imports
export * from './apiUtils';

// Re-export types from apiUtils
export type {
  AuditRecord,
  CaseObj,
  AuditPayload,
  Finding,
  CacheKey,
  Auditor,
  ClaimOwner,
  FindingId
} from './apiUtils';

// Re-export all API functions for centralized access
export {
  getAuditsByQuarter,
  getAuditsByAuditor,
  createAudit,
  updateAudit,
  addFindingToAudit,
  getFindingsByAudit,
  selectCasesForAudit,
  exportAuditReport,
  getRandomAuditForUser,
  selectQuarterlyDossiers,
  saveAuditVerification,
  verifyAuditAPI,
  rejectAuditAPI,
  getAuditVerification
} from './auditService';

// Re-export verification types
export type {
  VerificationData,
  VerificationResponse,
  UpdateVerificationRequest
} from './auditService';

// Re-export helper functions
export { createCacheKey, createFindingId } from './apiUtils';