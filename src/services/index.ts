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

// Re-export completion types from auditService
export type {
  CompletionData,
  CompletionResponse,
  UpdateCompletionRequest
} from './auditService';

// Re-export all API functions for centralized access
export {
  getAuditsByQuarter,
  getAuditsByAuditor,
  createAudit,
  updateAudit,
  addFindingToAudit,
  getFindingsByAudit,
  selectCasesForAudit,
  exportAuditsForQuarter,
  getRandomAuditForUser,
  selectQuarterlyDossiers,
  saveAuditCompletion,
  completeAuditAPI,
  getAuditCompletion
} from './auditService';

// Re-export helper functions
export { createCacheKey, createFindingId } from './apiUtils';