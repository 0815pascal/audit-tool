import { QuarterPeriod, CaseAuditData, UserAuditForSelection, AuditForSelection, ISODateString } from '../types/types';
import { UserId, CaseAuditId } from '../types/brandedTypes';
import { createCaseId } from '../types/typeHelpers';
import axios from 'axios';
import {
  ApiCache,
  AuditRecord,
  CaseObj,
  AuditPayload,
  Finding,
  createCacheKey
} from './apiUtils';
import { HTTP_METHOD } from '../enums';
import { API_BASE_PATH } from '../constants';
import { AUDIT_STATUS_ENUM } from '../enums';
import { CacheKey } from '../types/brandedTypes';

// Create an axios instance with base URL and improved error handling
const api = axios.create({
  baseURL: API_BASE_PATH,
  // Add request timeout
  timeout: 30000,
  // Accept all status codes to handle them in catch blocks
  validateStatus: () => true,
  headers: {
    'Content-Type': 'application/json'
  }
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
export const selectCasesForAudit = async (quarterPeriod: QuarterPeriod): Promise<CaseObj[]> => {
  const cacheKey = createCacheKey('select-cases', quarterPeriod);
  
  // Check cache first
  if (isCacheValid(caseCache, cacheKey)) {
    return caseCache.get(cacheKey)!.data;
  }
  
  try {
    console.log(`[API] Selecting cases for audit in quarter ${quarterPeriod}`);
    const response = await api.get<CaseObj[]>(`/audit-completion/select-quarterly/${quarterPeriod}`);
    
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

/**
 * Export audits for a given quarter
 */
export const exportAuditsForQuarter = (quarter: QuarterPeriod): void => {
  try {
    console.log(`[API] Exporting audits for quarter ${quarter}`);
    // Open the export endpoint in a new tab for download
    window.open(`${API_BASE_PATH}/audits/export?quarter=${quarter}`, '_blank');
  } catch (error) {
    console.error(`[API] Error exporting audits for quarter ${quarter}:`, error);
  }
};

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
  const baseUrl = `${API_BASE_PATH}/audits/random/${userId}`;
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
 * Select quarterly dossiers for auditing
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
  const response = await fetch(`${API_BASE_PATH}/audit-completion/select-quarterly`, {
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

// ===== AUDIT COMPLETION FUNCTIONS (merged from auditCompletionService.ts) =====

export interface CompletionData {
  auditorId: number;
  status: AUDIT_STATUS_ENUM;
  rating?: string;
  comment?: string;
  findings?: Finding[];
  isCompleted?: boolean;
}

export interface UpdateCompletionRequest {
  auditId: CaseAuditId;
  auditor: UserId;
  status: AUDIT_STATUS_ENUM;
  auditorId: number;
  rating?: string;
  comment?: string;
  findings?: CompletionData['findings'];
}

export interface CompletionResponse {
  success: boolean;
  data: CompletionData;
}

export const completeAuditAPI = async (
  caseAuditId: CaseAuditId | string,
  auditor: UserId | string,
  caseAuditData: CaseAuditData
): Promise<CompletionResponse> => {
  try {
    const response = await fetch(`${API_BASE_PATH}/audit/${caseAuditId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auditor,
        rating: caseAuditData.rating,
        comment: caseAuditData.comment,
        specialFindings: caseAuditData.specialFindings,
        detailedFindings: caseAuditData.detailedFindings,
        status: AUDIT_STATUS_ENUM.COMPLETED,
        isCompleted: true
      })
    });

    console.log(`[API] Completing audit ${caseAuditId}:`, caseAuditData);

    const data = await response.json();
    if (!response.ok) {
      console.error(`Failed to complete audit: ${data.error}`);
      throw new Error(data.error ?? 'Failed to complete audit');
    }

    return data;
  } catch (error) {
    console.error('[API] Error completing audit:', error);
    throw error;
  }
};

export const getAuditCompletion = async (caseAuditId: CaseAuditId | string): Promise<CompletionData | null> => {
  try {
    console.log(`[API] Getting audit completion data for ${caseAuditId}`);
    
    const response = await fetch(`${API_BASE_PATH}/audit/${caseAuditId}/completion`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[API] No completion data found for audit ${caseAuditId}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API] Error getting audit completion for ${caseAuditId}:`, error);
    return null;
  }
}; 