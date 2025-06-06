import { API_BASE_PATH } from '../constants';
import { CURRENCY } from '../types/currencyTypes';
import type { 
  AuditForSelection, 
  UserAuditForSelection, 
  QuarterPeriod,
  CaseAuditData
} from '../types/types';
import {CaseAuditId, UserId} from '../types/brandedTypes';
import {createCaseAuditId} from '../types/typeHelpers';
import {CaseObj} from './apiUtils';
import {AUDIT_STATUS_ENUM, HTTP_METHOD} from '../enums';
import { CompletionData, CompletionResponse } from './auditService.types';

/**
 * Get audits by quarter using new REST-compliant query parameter approach
 */
export const getAuditsByQuarter = async (quarter: QuarterPeriod): Promise<UserAuditForSelection[]> => {
  try {
    // Use query parameter approach (REST compliant)
    const url = new URL(`${API_BASE_PATH}/audits`, window.location.origin);
    url.searchParams.set('quarter', quarter);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map API response to our expected format
    return data.map((audit: Record<string, unknown>) => ({
      id: createCaseAuditId(String(audit.id)),
      auditId: createCaseAuditId(String(audit.id)), 
      userId: String(audit.userId),
      quarter,
      status: String(audit.status),
      auditor: String(audit.auditor ?? ''),
      coverageAmount: Number(audit.coverageAmount) || 0,
      isCompleted: Boolean(audit.isCompleted),
      claimsStatus: String(audit.claimsStatus) || 'FULL_COVER',
      notifiedCurrency: String(audit.notifiedCurrency) || CURRENCY.CHF
    }));
  } catch (error) {
    console.error(`Error fetching audits for quarter ${quarter}:`, error);
    throw error;
  }
};

/**
 * Get all cases for a quarter using new REST-compliant query parameter approach
 */
export const getAllCasesByQuarter = async (quarter: QuarterPeriod): Promise<CaseObj[]> => {
  try {
    // Use existing /cases/quarter endpoint (this remains the same as it's for different resource)
    const response = await fetch(`${API_BASE_PATH}/cases/quarter/${quarter}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((caseData: Record<string, unknown>) => ({
      caseNumber: String(caseData.caseNumber),
      claimOwner: {
        userId: String((caseData.claimOwner && (caseData.claimOwner as Record<string, unknown>).userId) ?? caseData.userId ?? 'unknown') as UserId,
        role: (caseData.claimOwner && (caseData.claimOwner as Record<string, unknown>).role) ?? 'STAFF'
      },
      coverageAmount: Number(caseData.coverageAmount) || 0,
      claimsStatus: String(caseData.claimsStatus) || 'FULL_COVER',
      caseStatus: String(caseData.caseStatus) || 'COMPENSATED',
      notificationDate: String(caseData.notificationDate),
      notifiedCurrency: String(caseData.notifiedCurrency) || CURRENCY.CHF
    }));
  } catch (error) {
    console.error(`Error fetching cases for quarter ${quarter}:`, error);
    throw error;
  }
};

/**
 * Get audits by auditor using new REST-compliant query parameter approach
 */
export const getAuditsByAuditor = async (auditorId: UserId): Promise<UserAuditForSelection[]> => {
  try {
    // Use query parameter approach (REST compliant)
    const url = new URL(`${API_BASE_PATH}/audits`, window.location.origin);
    url.searchParams.set('auditor', auditorId);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((audit: Record<string, unknown>) => ({
      id: createCaseAuditId(String(audit.id)),
      auditId: createCaseAuditId(String(audit.id)),
      userId: String(audit.userId),
      quarter: String(audit.quarter),
      status: String(audit.status),
      auditor: String(audit.auditor ?? ''),
      coverageAmount: Number(audit.coverageAmount) || 0,
      isCompleted: Boolean(audit.isCompleted),
      claimsStatus: String(audit.claimsStatus) || 'FULL_COVER',
      notifiedCurrency: String(audit.notifiedCurrency) || CURRENCY.CHF
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
    
    const response = await fetch(url, {
      method: HTTP_METHOD.POST,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create audit: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      id: createCaseAuditId(String(data.id)),
      auditId: createCaseAuditId(String(data.id)),
      userId: String(data.userId),
      quarter: data.quarter,
      status: data.status,
      auditor: data.auditor ?? '',
      coverageAmount: data.coverageAmount ?? 0,
      isCompleted: Boolean(data.isCompleted),
      claimsStatus: data.claimsStatus ?? 'FULL_COVER',
      notifiedCurrency: data.notifiedCurrency ?? CURRENCY.CHF
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
    
    const response = await fetch(url, {
      method: HTTP_METHOD.PUT,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update audit: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      id: createCaseAuditId(String(data.id)),
      auditId: createCaseAuditId(String(data.id)),
      userId: String(data.userId),
      quarter: data.quarter,
      status: data.status,
      auditor: data.auditor ?? '',
      coverageAmount: data.coverageAmount ?? 0,
      isCompleted: Boolean(data.isCompleted),
      claimsStatus: data.claimsStatus ?? 'FULL_COVER',
      notifiedCurrency: data.notifiedCurrency ?? CURRENCY.CHF
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
    
    const response = await fetch(url, {
      method: HTTP_METHOD.POST,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
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
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch findings: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching findings for audit ${caseAuditId}:`, error);
    throw error;
  }
};

/**
 * Select cases for audit in a given quarter
 */
export const selectCasesForAudit = async (quarterPeriod: QuarterPeriod, preLoadedCount: number = 0): Promise<CaseObj[]> => {
  try {
    // Use the select-cases endpoint that accounts for pre-loaded cases
    const url = `${API_BASE_PATH}/audits/select-cases/${quarterPeriod}`;
    const params = preLoadedCount > 0 ? `?preLoadedCount=${preLoadedCount}` : '';
    
    const response = await fetch(`${url}${params}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // The response should be an array of CaseObj directly
    return data.map((caseData: Record<string, unknown>) => ({
      caseNumber: String(caseData.caseNumber),
      claimOwner: {
        userId: String((caseData.claimOwner && (caseData.claimOwner as Record<string, unknown>).userId) ?? caseData.userId ?? 'unknown') as UserId,
        role: (caseData.claimOwner && (caseData.claimOwner as Record<string, unknown>).role) ?? 'STAFF'
      },
      coverageAmount: Number(caseData.coverageAmount) || 0,
      claimsStatus: String(caseData.claimsStatus) || 'FULL_COVER',
      caseStatus: String(caseData.caseStatus) || 'COMPENSATED',
      notificationDate: String(caseData.notificationDate),
      notifiedCurrency: String(caseData.notifiedCurrency) || CURRENCY.CHF
    }));
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
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to export audits: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error(`Error exporting audits for quarter ${quarter}:`, error);
    throw error;
  }
};

// ===== AUDIT COMPLETION FUNCTIONS =====

export const completeAuditAPI = async (
  caseAuditId: CaseAuditId | string,
  auditor: UserId | string,
  caseAuditData: CaseAuditData
): Promise<CompletionResponse> => {
  try {
    // Use new standardized completion endpoint
    const response = await fetch(`${API_BASE_PATH}/audits/${caseAuditId}/completion`, {
      method: HTTP_METHOD.POST,
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
    // Use new standardized completion endpoint
    const response = await fetch(`${API_BASE_PATH}/audits/${caseAuditId}/completion`);
    
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