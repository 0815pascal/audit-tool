import { QuarterPeriod, CaseAuditData, UserAuditForSelection, AuditForSelection, ISODateString, ApiResponse } from '../types/types';
import { UserId, CaseAuditId } from '../types/brandedTypes';
import { createCaseId, createEmptyFindings } from '../types/typeHelpers';
import axios from 'axios';
import {
  ApiCache,
  AuditRecord,
  CaseObj,
  AuditPayload,
  Finding,
  CacheKey,
  createCacheKey
} from './apiUtils';
import { HTTP_METHOD } from '../enums';

// Create an axios instance with base URL and improved error handling
const api = axios.create({
  baseURL: '/api',
  // Add request timeout
  timeout: 30000,
  // Accept all status codes to handle them in catch blocks
  validateStatus: () => true
});

// Cache TTL configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Create specialized caches for different data types
const auditCache: ApiCache<AuditRecord[]> = new Map();
const caseCache: ApiCache<CaseObj[]> = new Map();

// Check if cached data is still valid
const isCacheValid = <T>(cache: ApiCache<T>, cacheKey: CacheKey): boolean => {
  const cachedItem = cache.get(cacheKey);
  if (cachedItem) {
    const { timestamp } = cachedItem;
    return Date.now() - timestamp < CACHE_TTL;
  }
  return false;
};

// Fetch all audits for a given quarter (e.g. "Q1-2024")
export const getAuditsByQuarter = async (quarter: QuarterPeriod): Promise<AuditRecord[]> => {
  const cacheKey = createCacheKey('quarter', quarter);
  
  // Check cache first
  if (isCacheValid(auditCache, cacheKey)) {
    return auditCache.get(cacheKey)!.data;
  }
  
  try {
    console.log(`[API] Fetching audits for quarter ${quarter}`);
    const response = await api.get<AuditRecord[]>(`/audits/quarter/${quarter}`);
    
    // Handle error status codes
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} fetching audits for quarter ${quarter}`);
      return [];
    }
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('[API] Non-array data returned for audits');
      return [];
    }
    
    // Cache the response
    auditCache.set(cacheKey, { 
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching audits for quarter ${quarter}:`, error);
    return [];
  }
};

// Fetch audits performed by a specific auditor
export const getAuditsByAuditor = async (auditorId: UserId): Promise<AuditRecord[]> => {
  const cacheKey = createCacheKey('auditor', auditorId);
  
  // Check cache first
  if (isCacheValid(auditCache, cacheKey)) {
    return auditCache.get(cacheKey)!.data;
  }
  
  try {
    console.log(`[API] Fetching audits for auditor ${auditorId}`);
    const response = await api.get<AuditRecord[]>(`/audits/auditor/${auditorId}`);
    
    // Handle error status codes
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} fetching audits for auditor ${auditorId}`);
      return [];
    }
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('[API] Non-array data returned for auditor audits');
      return [];
    }
    
    // Cache the response
    auditCache.set(cacheKey, { 
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching audits for auditor ${auditorId}:`, error);
    return [];
  }
};

// Start a new audit for a case in the given quarter
export const createAudit = async (
    payload: AuditPayload
): Promise<AuditRecord> => {
  console.log(`[API] Creating audit for case ${payload.caseObj.caseNumber}`);
  const response = await api.post<AuditRecord>('/audits', payload);

  if (response.status >= 400) {
    console.warn(`[API] Error ${response.status} creating audit`);
    throw new Error(`Failed to create audit: ${response.status}`);
  }

  return response.data;
};

// Update an existing audit record
export const updateAudit = async (
    caseAuditId: CaseAuditId,
    payload: AuditPayload
): Promise<AuditRecord> => {
  console.log(`[API] Updating audit ${caseAuditId}`);
  const response = await api.put<AuditRecord>(`/audits/${caseAuditId}`, payload);

  if (response.status >= 400) {
    console.warn(`[API] Error ${response.status} updating audit ${caseAuditId}`);
    throw new Error(`Failed to update audit: ${response.status}`);
  }

  return response.data;
};

// Add a finding to an audit
export const addFindingToAudit = async (
    caseAuditId: CaseAuditId,
    payload: { type: Finding['type']; description: string }
): Promise<Finding> => {
  console.log(`[API] Adding finding to audit ${caseAuditId}`);
  const response = await api.post<Finding>(`/audits/${caseAuditId}/findings`, payload);

  if (response.status >= 400) {
    console.warn(`[API] Error ${response.status} adding finding to audit ${caseAuditId}`);
    throw new Error(`Failed to add finding: ${response.status}`);
  }

  return response.data;
};

// Get all findings for an audit
export const getFindingsByAudit = async (caseAuditId: CaseAuditId): Promise<Finding[]> => {
  try {
    console.log(`[API] Fetching findings for audit ${caseAuditId}`);
    const response = await api.get<Finding[]>(`/audits/${caseAuditId}/findings`);
    
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} fetching findings for audit ${caseAuditId}`);
      return [];
    }
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('[API] Non-array data returned for findings');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching findings for audit ${caseAuditId}:`, error);
    return [];
  }
};

// Select cases for audit in a given quarter (8 current + 2 previous quarter)
export const selectCasesForAudit = async (quarter: QuarterPeriod): Promise<CaseObj[]> => {
  const cacheKey = createCacheKey('select-cases', quarter);
  
  // Check cache first
  if (isCacheValid(caseCache, cacheKey)) {
    return caseCache.get(cacheKey)!.data;
  }
  
  try {
    console.log(`[API] Selecting cases for audit in quarter ${quarter}`);
    const response = await api.get<CaseObj[]>(`/audits/select-cases/${quarter}`);
    
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} selecting cases for audit`);
      return [];
    }
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('[API] Non-array data returned for cases');
      return [];
    }
    
    // Process the response to ensure proper typing
    const typedData = response.data.map(caseObj => ({
      ...caseObj,
      caseNumber: createCaseId(Number(caseObj.caseNumber))
    }));
    
    // Cache the response
    caseCache.set(cacheKey, { 
      data: typedData,
      timestamp: Date.now()
    });
    
    return typedData;
  } catch (error) {
    console.error(`[API] Error selecting cases for audit:`, error);
    return [];
  }
};

// Export audit report
export const exportAuditReport = (quarter: QuarterPeriod): void => {
  window.open(`/api/audits/export?quarter=${quarter}`, '_blank');
};

/**
 * Get a random audit for a user, with optional quarter and year
 */
/**
 * Get a random audit for a user, with optional quarter and year
 */
export async function getRandomAuditForUser(
    userId: UserId,
    quarter?: QuarterPeriod,
    year?: number
): Promise<AuditRecord> {
  // Build the query parameters
  const params = new URLSearchParams();
  if (quarter) params.append('quarter', quarter.toString());
  if (year) params.append('year', year.toString());

  // Build the URL without nested template literals
  const baseUrl = `/api/audits/random/${userId}`;
  const queryString = params.toString();
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  const response = await fetch(url, { method: HTTP_METHOD.GET });

  if (!response.ok) {
    throw new Error(`Failed to get random audit: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error ?? 'Failed to get random audit');
  }

  return data.data;
}

/**
 * Select quarterly dossiers for verification
 */
/**
 * Select quarterly dossiers for verification
 */
export async function selectQuarterlyDossiers(
    quarterKey: string,
    userIds: UserId[]
): Promise<{
  quarterKey: string;
  userQuarterlyAudits: UserAuditForSelection[];
  previousQuarterRandomAudits: AuditForSelection[];
  lastSelectionDate: ISODateString;
}> {
  // Make the API request
  const response = await fetch('/api/verification/select-quarterly', {
    method: HTTP_METHOD.POST,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quarterKey,
      userIds
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to select quarterly dossiers: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error ?? 'Failed to select quarterly dossiers');
  }

  return data.data;
}

// ===== VERIFICATION FUNCTIONS (merged from auditVerificationService.ts) =====

// Backend API types for verification data
export interface VerificationData {
  verifierId: number;
  status: 'verified' | 'in_progress' | 'not_verified';
  rating?: string;
  comment?: string;
  findings?: Finding[];
  isVerified?: boolean;
}

// Request payload for updating verification data
export interface UpdateVerificationRequest {
  status: VerificationData['status'];
  verifierId: number;
  rating?: string;
  comment?: string;
  findings?: VerificationData['findings'];
}

// Response from backend verification API
export interface VerificationResponse {
  success: boolean;
  data?: VerificationData;
  error?: string;
}

/**
 * Save audit verification data (in-progress state)
 */
/**
 * Save audit verification data (in-progress state)
 */
export const saveAuditVerification = async (
    auditId: CaseAuditId | string,
    verifierId: UserId,
    caseAuditData: CaseAuditData
): Promise<VerificationResponse> => {
  const numericAuditId = parseInt(typeof auditId === 'string' ? auditId.replace(/\D/g, '') : String(auditId).replace(/\D/g, ''));
  const numericVerifierId = parseInt(String(verifierId));

  const requestData: UpdateVerificationRequest = {
    status: 'in_progress',
    verifierId: numericVerifierId,
    rating: caseAuditData.rating,
    comment: caseAuditData.comment
  };

  console.log(`[API] Saving verification data for audit ${auditId}:`, requestData);

  const response = await api.put<VerificationResponse>(
      `/audit-verification/${numericAuditId}`,
      requestData
  );

  if (!response.data.success) {
    throw new Error(response.data.error ?? 'Failed to save verification data');
  }

  return response.data;
};

/**
 * Verify audit
 */
export const verifyAuditAPI = async (
  caseAuditId: CaseAuditId | string,
  verifier: UserId | string,
  caseAuditData: CaseAuditData
): Promise<VerificationResponse> => {
  const numericAuditId = parseInt(typeof caseAuditId === 'string' ? caseAuditId.replace(/\D/g, '') : String(caseAuditId).replace(/\D/g, ''));
  const numericVerifierId = parseInt(typeof verifier === 'string' ? verifier.replace(/\D/g, '') : String(verifier).replace(/\D/g, ''));

  const requestData = {
    verifier: numericVerifierId,
    comment: caseAuditData.comment || '',
    rating: caseAuditData.rating || '',
    specialFindings: caseAuditData.specialFindings || createEmptyFindings(),
    detailedFindings: caseAuditData.detailedFindings || createEmptyFindings(),
    status: 'verified' as const,
    isVerified: true
  };

  try {
    console.log(`[API] Verifying audit ${caseAuditId}:`, requestData);

    const response = await api.put<ApiResponse<VerificationData>>(`/audit-verification/${numericAuditId}`, requestData);

    if (!response.data.success) {
      console.error(`Failed to verify audit: ${response.data.error}`);
      throw new Error(response.data.error ?? 'Failed to verify audit');
    }

    return response.data;
  } catch (error) {
    console.error('[API] Error verifying audit:', error);
    throw error;
  }
};

/**
 * Get verification data for an audit
 */
export const getAuditVerification = async (caseAuditId: CaseAuditId | string): Promise<VerificationData | null> => {
  try {
    const numericAuditId = parseInt(typeof caseAuditId === 'string' ? caseAuditId.replace(/\D/g, '') : String(caseAuditId).replace(/\D/g, ''));

    console.log(`[API] Fetching verification data for audit ${caseAuditId}`);

    const response = await api.get<VerificationResponse>(`/audit-verification/${numericAuditId}`);

    if (!response.data.success) {
      console.warn(`Failed to fetch verification data: ${response.data.error}`);
      return null;
    }

    return response.data.data || null;
  } catch (error) {
    console.error('[API] Error fetching verification data:', error);
    return null;
  }
}; 