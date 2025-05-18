import axios from 'axios';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: '/api',
});

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
  caseObj: CaseObj;
  auditor: Auditor;
}

export interface Finding {
  findingId: number;
  type: string;
  description: string;
}

// Fetch all audits for a given quarter (e.g. "Q1-2024")
export const getAuditsByQuarter = async (quarter: string): Promise<AuditRecord[]> => {
  try {
    const response = await api.get<AuditRecord[]>(`/audits/quarter/${quarter}`);
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('API returned non-array data:', response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching audits for quarter ${quarter}:`, error);
    return []; // Return empty array on error
  }
};

// Fetch audits performed by a specific auditor
export const getAuditsByAuditor = async (auditorId: number): Promise<AuditRecord[]> => {
  try {
    const response = await api.get<AuditRecord[]>(`/audits/auditor/${auditorId}`);
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('API returned non-array data:', response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching audits for auditor ${auditorId}:`, error);
    return []; // Return empty array on error
  }
};

// Start a new audit for a case in the given quarter
export const createAudit = async (
  payload: { quarter: string; caseObj: { caseNumber: number }; auditor: { userId: number } }
): Promise<AuditRecord> => {
  const response = await api.post<AuditRecord>('/audits', payload);
  return response.data;
};

// Update an existing audit record
export const updateAudit = async (
  auditId: number,
  payload: { quarter: string; caseObj: { caseNumber: number }; auditor: { userId: number } }
): Promise<AuditRecord> => {
  const response = await api.put<AuditRecord>(`/audits/${auditId}`, payload);
  return response.data;
};

// Add a finding to an audit
export const addFindingToAudit = async (
  auditId: number,
  payload: { type: string; description: string }
): Promise<Finding> => {
  const response = await api.post<Finding>(`/audits/${auditId}/findings`, payload);
  return response.data;
};

// Get all findings for a given audit
export const getFindingsByAudit = async (auditId: number): Promise<Finding[]> => {
  try {
    const response = await api.get<Finding[]>(`/audits/${auditId}/findings`);
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('API returned non-array data:', response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching findings for audit ${auditId}:`, error);
    return []; // Return empty array on error
  }
};

// Select cases available for audit in a given quarter
export const selectCasesForAudit = async (quarter: string): Promise<CaseObj[]> => {
  try {
    const response = await api.get<CaseObj[]>(`/audits/select-cases/${quarter}`);
    
    // Ensure we're returning an array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('API returned non-array data:', response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching cases for quarter ${quarter}:`, error);
    return []; // Return empty array on error
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
  const response = await api.get<AuditStatistics>(`/audit-reports/statistics/${quarter}`);
  return response.data;
}; 