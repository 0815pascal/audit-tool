import axios from 'axios';

// Create an axios instance with base URL and improved error handling
const api = axios.create({
  baseURL: '/api',
  // Add request timeout
  timeout: 10000,
  // Accept all status codes to handle them in catch blocks
  validateStatus: (_) => true
});

// Create a cache for API responses
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Check if cached data is still valid
const isCacheValid = (cacheKey: string): boolean => {
  if (apiCache.has(cacheKey)) {
    const { timestamp } = apiCache.get(cacheKey)!;
    return Date.now() - timestamp < CACHE_TTL;
  }
  return false;
};

// Data types returned by the backend
export interface ClaimOwner {
  userId: number;
  role: string;
}

export interface CaseObj {
  caseNumber: number;
  claimOwner: ClaimOwner;
  claimsStatus: string;
  coverageAmount: number;
  caseStatus: string;
}

export interface Auditor {
  userId: number;
  role: string;
}

export interface AuditRecord {
  auditId: number;
  quarter: string;
  caseObj?: {
    caseNumber: number;
    claimOwner?: {
      userId: number;
      role: string;
    };
    coverageAmount?: number;
    claimsStatus?: string;
    caseStatus?: string;
  };
  auditor: {
    userId: number;
    role: string;
  };
  isAkoReviewed: boolean;
}

export interface Finding {
  findingId: number;
  type: string;
  description: string;
}

// Fetch all audits for a given quarter (e.g. "Q1-2024")
export const getAuditsByQuarter = async (quarter: string): Promise<AuditRecord[]> => {
  const cacheKey = `quarter-${quarter}`;
  
  // Check cache first
  if (isCacheValid(cacheKey)) {
    return apiCache.get(cacheKey)!.data;
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
    apiCache.set(cacheKey, { 
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
export const getAuditsByAuditor = async (auditorId: number): Promise<AuditRecord[]> => {
  const cacheKey = `auditor-${auditorId}`;
  
  // Check cache first
  if (isCacheValid(cacheKey)) {
    return apiCache.get(cacheKey)!.data;
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
    apiCache.set(cacheKey, { 
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
  payload: { quarter: string; caseObj: { caseNumber: number }; auditor: { userId: number } }
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
  auditId: number,
  payload: { quarter: string; caseObj: { caseNumber: number }; auditor: { userId: number } }
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
  auditId: number,
  payload: { type: string; description: string }
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

// Get all findings for a given audit
export const getFindingsByAudit = async (auditId: number): Promise<Finding[]> => {
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

// Select cases available for audit in a given quarter
export const selectCasesForAudit = async (quarter: string): Promise<CaseObj[]> => {
  const cacheKey = `select-cases-${quarter}`;
  
  // Check cache first
  if (isCacheValid(cacheKey)) {
    return apiCache.get(cacheKey)!.data;
  }
  
  try {
    console.log(`[API] Selecting cases for quarter ${quarter}`);
    const response = await api.get<CaseObj[]>(`/audits/select-cases/${quarter}`);
    
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} selecting cases for quarter ${quarter}`);
      return [];
    }
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('[API] Non-array data returned for cases');
      return [];
    }
    
    // Cache the response
    apiCache.set(cacheKey, { 
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error selecting cases for quarter ${quarter}:`, error);
    return [];
  }
};

// Export audit results as CSV. Users can trigger download directly via window.location
export const exportAuditReport = (quarter: string): void => {
  window.location.assign(`/api/audit-reports/export/${quarter}`);
};

// Fetch audit statistics for the quarter
export interface AuditStatistics {
  totalAudits: number;
  averageScore: number;
}

export const getAuditStatistics = async (quarter: string): Promise<AuditStatistics> => {
  try {
    console.log(`[API] Fetching statistics for quarter ${quarter}`);
    const response = await api.get<AuditStatistics>(`/audit-reports/statistics/${quarter}`);
    
    if (response.status >= 400) {
      console.warn(`[API] Error ${response.status} fetching statistics for quarter ${quarter}`);
      return { totalAudits: 0, averageScore: 0 };
    }
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching statistics for quarter ${quarter}:`, error);
    return { totalAudits: 0, averageScore: 0 };
  }
}; 