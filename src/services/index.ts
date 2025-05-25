// Export all services and utility functions for easier imports
export * from './ApiService';
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

// Create and export API singleton instance
import { ApiService } from './ApiService';

export const api = new ApiService();

// Convenience function to initialize all services
export function initializeServices(baseApiUrl: string = '/api'): void {
  // Configure API service
  const newApi = new ApiService(baseApiUrl);
  Object.assign(api, newApi);
  
  // Can initialize other services here as needed
  console.log(`Services initialized with API URL: ${baseApiUrl}`);
} 