// Export all services and utility functions for easier imports
export * from './apiUtils';

// Re-export types from apiUtils
export type {
  ClaimOwner,
  CaseObj,
  Auditor,
  AuditRecord,
  Finding,
  AuditPayload,
  ApiCache
} from './apiUtils';

// Re-export branded types from brandedTypes
export type {
  CacheKey,
  FindingId
} from '../types/brandedTypes';

// Re-export helper functions
export {
  createCacheKey,
  createFindingId
} from './apiUtils';

// Re-export audit service functions
export {
  getAuditsByQuarter,
  getAuditsByAuditor,
  createAudit,
  updateAudit,
  addAuditFinding,
  getAuditFindings,
  selectCasesForAudit,
  exportAuditsForQuarter,
  completeAuditAPI,
  getAuditCompletion
} from './auditService';

// Re-export types separately
export type {
  CompletionData,
  UpdateCompletionRequest,
  CompletionResponse
} from './auditService';