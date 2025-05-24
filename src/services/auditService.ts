import { createCaseId, QuarterPeriod, AuditId, UserId } from '../types';
import axios from 'axios';
import {
  ApiCache,
  AuditRecord,
  CaseObj,
  AuditPayload,
  Finding,
  CacheKey,
  createCacheKey
} from './apiTypes';
import {
  UserAuditForSelection,
  AuditForSelection,
  ISODateString
} from '../types';
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
  try {
    console.log(`[API] Creating audit for case ${payload.caseObj.caseNumber}`);
    const response = await api.post<AuditRecord>('/audits', payload);
    
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} creating audit`);
      throw new Error(`Failed to create audit: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('[API] Error creating audit:', error);
    throw error;
  }
};

// Update an existing audit record
export const updateAudit = async (
  auditId: AuditId,
  payload: AuditPayload
): Promise<AuditRecord> => {
  try {
    console.log(`[API] Updating audit ${auditId}`);
    const response = await api.put<AuditRecord>(`/audits/${auditId}`, payload);
    
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} updating audit ${auditId}`);
      throw new Error(`Failed to update audit: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error updating audit ${auditId}:`, error);
    throw error;
  }
};

// Add a finding to an audit
export const addFindingToAudit = async (
  auditId: AuditId,
  payload: { type: Finding['type']; description: string }
): Promise<Finding> => {
  try {
    console.log(`[API] Adding finding to audit ${auditId}`);
    const response = await api.post<Finding>(`/audits/${auditId}/findings`, payload);
    
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} adding finding to audit ${auditId}`);
      throw new Error(`Failed to add finding: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error adding finding to audit ${auditId}:`, error);
    throw error;
  }
};

// Get all findings for an audit
export const getFindingsByAudit = async (auditId: AuditId): Promise<Finding[]> => {
  try {
    console.log(`[API] Fetching findings for audit ${auditId}`);
    const response = await api.get<Finding[]>(`/audits/${auditId}/findings`);
    
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} fetching findings for audit ${auditId}`);
      return [];
    }
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('[API] Non-array data returned for findings');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching findings for audit ${auditId}:`, error);
    return [];
  }
};

// Select cases for audit in a given quarter
export const selectCasesForAudit = async (quarter: QuarterPeriod): Promise<CaseObj[]> => {
  const cacheKey = createCacheKey('cases', quarter);
  
  // Check cache first
  if (isCacheValid(caseCache, cacheKey)) {
    return caseCache.get(cacheKey)!.data;
  }
  
  try {
    console.log(`[API] Selecting cases for audit in quarter ${quarter}`);
    const response = await api.get<CaseObj[]>(`/cases/select?quarter=${quarter}`);
    
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
export async function getRandomAuditForUser(
  userId: UserId,
  quarter?: string | QuarterPeriod,
  year?: number
): Promise<AuditRecord> {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    if (quarter) params.append('quarter', quarter.toString());
    if (year) params.append('year', year.toString());
    
    // Make the API request
    const response = await fetch(
      `/api/audits/random/${userId}${params.toString() ? `?${params}` : ''}`,
      { method: HTTP_METHOD.GET }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get random audit: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get random audit');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error in getRandomAuditForUser:', error);
    throw error;
  }
}

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
  try {
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
      throw new Error(data.error || 'Failed to select quarterly dossiers');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error in selectQuarterlyDossiers:', error);
    throw error;
  }
} 