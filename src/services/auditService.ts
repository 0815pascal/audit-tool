import { QuarterPeriod, CaseAuditData, UserAuditForSelection, AuditForSelection } from '../types/types';
import { UserId, CaseAuditId } from '../types/brandedTypes';
import { createCaseAuditId } from '../types/typeHelpers';
import axios from 'axios';
import { CaseObj } from './apiUtils';
import { AUDIT_STATUS_ENUM } from '../enums';
import { API_BASE_PATH } from '../constants';
import { ApiAuditResponse } from '../mocks/mockTypes';

/**
 * Fetch audits for a specific quarter
 */
export const getAuditsByQuarter = async (quarter: QuarterPeriod): Promise<UserAuditForSelection[]> => {
  try {
    const url = `${API_BASE_PATH}/api/audits/quarter/${quarter}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch audits: ${response.status}`);
    }
    
    return response.data.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      userId: String(item.userId),
      quarter: item.quarter,
      status: item.status,
      auditor: item.auditor || '',
      coverageAmount: item.coverageAmount || 0,
      isCompleted: Boolean(item.isCompleted),
      isAkoReviewed: Boolean(item.isAkoReviewed),
      claimsStatus: item.claimsStatus || 'FULL_COVER',
      notifiedCurrency: item.notifiedCurrency || 'CHF'
    }));
  } catch (error) {
    console.error(`Error fetching audits for quarter ${quarter}:`, error);
    throw error;
  }
};

/**
 * Fetch ALL cases for a specific quarter (not just selected for audit)
 * This is used when user selects a quarter from dropdown to show all cases
 */
export const getAllCasesByQuarter = async (quarter: QuarterPeriod): Promise<CaseObj[]> => {
  try {
    const url = `${API_BASE_PATH}/cases/quarter/${quarter}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch all cases: ${response.status}`);
    }
    
    // The response should be an array of case objects
    return response.data.map((caseData: Record<string, unknown>) => ({
      caseNumber: String(caseData.caseNumber),
      claimOwner: {
        userId: String((caseData.claimOwner && (caseData.claimOwner as Record<string, unknown>).userId) || caseData.userId || 'unknown') as UserId,
        displayName: String((caseData.claimOwner && (caseData.claimOwner as Record<string, unknown>).displayName) || caseData.displayName || 'Unknown')
      },
      coverageAmount: Number(caseData.coverageAmount) || 0,
      claimsStatus: String(caseData.claimsStatus) || 'FULL_COVER',
      notificationDate: String(caseData.notificationDate),
      notifiedCurrency: String(caseData.notifiedCurrency) || 'CHF'
    }));
  } catch (error) {
    console.error(`Error fetching all cases for quarter ${quarter}:`, error);
    throw error;
  }
};

/**
 * Fetch audits by auditor
 */
export const getAuditsByAuditor = async (auditorId: UserId): Promise<UserAuditForSelection[]> => {
  try {
    const url = `${API_BASE_PATH}/api/audits/auditor/${auditorId}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch audits: ${response.status}`);
    }
    
    return response.data.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      userId: String(item.userId),
      quarter: item.quarter,
      status: item.status,
      auditor: item.auditor || '',
      coverageAmount: item.coverageAmount || 0,
      isCompleted: Boolean(item.isCompleted),
      isAkoReviewed: Boolean(item.isAkoReviewed),
      claimsStatus: item.claimsStatus || 'FULL_COVER',
      notifiedCurrency: item.notifiedCurrency || 'CHF'
    }));
  } catch (error) {
    console.error(`Error fetching audits for auditor ${auditorId}:`, error);
    throw error;
  }
};

/**
 * Create a new audit
 */
export const createAudit = async (payload: Record<string, unknown>): Promise<AuditForSelection> => {
  try {
    const url = `${API_BASE_PATH}/api/audits`;
    
    const response = await axios.post(url, payload);
    
    if (response.status !== 201) {
      throw new Error(`Failed to create audit: ${response.status}`);
    }
    
    const data = response.data;
    return {
      id: createCaseAuditId(String(data.id)),
      auditId: createCaseAuditId(String(data.id)),
      userId: String(data.userId),
      quarter: data.quarter,
      status: data.status,
      auditor: data.auditor || '',
      coverageAmount: data.coverageAmount || 0,
      isCompleted: Boolean(data.isCompleted),
      isAkoReviewed: Boolean(data.isAkoReviewed),
      claimsStatus: data.claimsStatus || 'FULL_COVER',
      notifiedCurrency: data.notifiedCurrency || 'CHF'
    };
  } catch (error) {
    console.error('Error creating audit:', error);
    throw error;
  }
};

/**
 * Update an existing audit
 */
export const updateAudit = async (caseAuditId: CaseAuditId, payload: Record<string, unknown>): Promise<AuditForSelection> => {
  try {
    const url = `${API_BASE_PATH}/api/audits/${caseAuditId}`;
    
    const response = await axios.put(url, payload);
    
    if (response.status !== 200) {
      throw new Error(`Failed to update audit: ${response.status}`);
    }
    
    const data = response.data;
    return {
      id: createCaseAuditId(String(data.id)),
      auditId: createCaseAuditId(String(data.id)),
      userId: String(data.userId),
      quarter: data.quarter,
      status: data.status,
      auditor: data.auditor || '',
      coverageAmount: data.coverageAmount || 0,
      isCompleted: Boolean(data.isCompleted),
      isAkoReviewed: Boolean(data.isAkoReviewed),
      claimsStatus: data.claimsStatus || 'FULL_COVER',
      notifiedCurrency: data.notifiedCurrency || 'CHF'
    };
  } catch (error) {
    console.error(`Error updating audit ${caseAuditId}:`, error);
    throw error;
  }
};

/**
 * Add finding to audit
 */
export const addAuditFinding = async (caseAuditId: CaseAuditId, payload: Record<string, unknown>): Promise<void> => {
  try {
    const url = `${API_BASE_PATH}/api/audits/${caseAuditId}/findings`;
    
    const response = await axios.post(url, payload);
    
    if (response.status !== 201) {
      throw new Error(`Failed to add finding: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error adding finding to audit ${caseAuditId}:`, error);
    throw error;
  }
};

/**
 * Get audit findings
 */
export const getAuditFindings = async (caseAuditId: CaseAuditId): Promise<unknown> => {
  try {
    const url = `${API_BASE_PATH}/api/audits/${caseAuditId}/findings`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch findings: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching findings for audit ${caseAuditId}:`, error);
    throw error;
  }
};

/**
 * Select cases for audit in a given quarter
 */
export const selectCasesForAudit = async (quarterPeriod: QuarterPeriod): Promise<CaseObj[]> => {
  try {
    // Use the correct endpoint that matches MSW handlers
    const response = await axios.get(`${API_BASE_PATH}/audits/quarter/${quarterPeriod}`);
    
    if (response.status !== 200) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    // The MSW handler returns audits, but we need to extract the caseObj from each audit
    const audits = response.data as ApiAuditResponse[];
    const caseObjs = audits.map(audit => ({
      ...audit.caseObj,
      claimOwner: {
        ...audit.caseObj.claimOwner,
        userId: String(audit.caseObj.claimOwner.userId) as UserId
      }
    }));
    
    return caseObjs;
  } catch (error) {
    console.error(`Error selecting cases for audit in quarter ${quarterPeriod}:`, error);
    throw error;
  }
};

/**
 * Export audits for a given quarter
 */
export const exportAuditsForQuarter = async (quarter: QuarterPeriod): Promise<Blob> => {
  try {
    const url = `${API_BASE_PATH}/api/audits/quarter/${quarter}/export`;
    
    const response = await axios.get(url, {
      responseType: 'blob'
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to export audits: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error exporting audits for quarter ${quarter}:`, error);
    throw error;
  }
};

// ===== AUDIT COMPLETION FUNCTIONS =====

export interface CompletionData {
  auditorId: number;
  status: AUDIT_STATUS_ENUM;
  rating?: string;
  comment?: string;
  isCompleted?: boolean;
}

export interface UpdateCompletionRequest {
  auditId: CaseAuditId;
  auditor: UserId;
  status: AUDIT_STATUS_ENUM;
  auditorId: number;
  rating?: string;
  comment?: string;
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
    const response = await fetch(`${API_BASE_PATH}/audit/${caseAuditId}/completion`);
    
    if (!response.ok) {
      if (response.status === 404) {
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