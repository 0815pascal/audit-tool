import { 
  CaseAuditId, 
  CaseAuditData
} from '../caseAuditTypes';
import { 
  UserId, 
  FindingType, 
  FindingsRecord 
} from '../types';
import { ApiService } from './ApiService';

// Create API service instance
const api = new ApiService();

// Backend API types for verification data
export interface VerificationData {
  auditId: number;
  status: 'verified' | 'rejected' | 'in_progress' | 'not_verified';
  verifierId: number;
  rating?: string;
  comment?: string;
  verificationDate?: string;
  findings?: Array<{
    type: string;
    description: string;
    category: 'special' | 'detailed';
  }>;
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
 * Convert frontend findings to backend format
 */
const convertFindingsToBackendFormat = (
  specialFindings: FindingsRecord,
  detailedFindings: FindingsRecord
): VerificationData['findings'] => {
  const findings: VerificationData['findings'] = [];

  // Convert special findings
  Object.entries(specialFindings).forEach(([key, value]) => {
    if (value === true) {
      findings.push({
        type: key,
        description: getSpecialFindingDescription(key as FindingType),
        category: 'special'
      });
    }
  });

  // Convert detailed findings
  Object.entries(detailedFindings).forEach(([key, value]) => {
    if (value === true) {
      findings.push({
        type: key,
        description: getDetailedFindingDescription(key as FindingType),
        category: 'detailed'
      });
    }
  });

  return findings;
};

/**
 * Get description for special findings
 */
const getSpecialFindingDescription = (findingType: FindingType): string => {
  const descriptions: Record<string, string> = {
    'FEEDBACK': 'Kundenfeedback über ausgezeichnete Bearbeitung',
    'COMMUNICATION': 'Optimale Kundenkommunikation',
    'RECOURSE': 'Überdurchschnittliche Leistung im Regress oder zur Schadenvermeidung',
    'NEGOTIATION': 'Besonderes Verhandlungsgeschick',
    'PERFECT_TIMING': 'Perfekte zeitliche und inhaltliche Bearbeitung'
  };
  return descriptions[findingType] || 'Special finding';
};

/**
 * Get description for detailed findings
 */
const getDetailedFindingDescription = (findingType: FindingType): string => {
  const descriptions: Record<string, string> = {
    'FACTS_INCORRECT': 'Relevanter Sachverhalt nicht plausibel dargestellt.',
    'TERMS_INCORRECT': 'Liefer-/Vertragsbedingungen nicht erfasst.',
    'COVERAGE_INCORRECT': 'Deckungssumme nicht korrekt erfasst.',
    'ADDITIONAL_COVERAGE_MISSED': 'Zusatzdeckungen nicht berücksichtigt.',
    'DECISION_NOT_COMMUNICATED': 'Entschädigungsabrechnung nicht fristgerecht.',
    'COLLECTION_INCORRECT': 'Falsche oder keine Inkassomassnahmen.',
    'RECOURSE_WRONG': 'Regressmassnahmen falsch beurteilt.',
    'COST_RISK_WRONG': 'Kostenrisiko rechtlicher Beitreibung falsch eingeschätzt.',
    'BPR_WRONG': 'BPR nicht richtig instruiert.',
    'COMMUNICATION_POOR': 'Kommunikation mit VN verbesserungswürdig.'
  };
  return descriptions[findingType] || 'Detailed finding';
};

/**
 * Save audit verification data (in-progress state)
 */
export const saveAuditVerification = async (
  auditId: CaseAuditId | string,
  verifierId: UserId,
  caseAuditData: CaseAuditData
): Promise<VerificationResponse> => {
  try {
    const numericAuditId = parseInt(typeof auditId === 'string' ? auditId.replace(/\D/g, '') : String(auditId).replace(/\D/g, ''));
    const numericVerifierId = parseInt(String(verifierId));

    const findings = convertFindingsToBackendFormat(
      caseAuditData.specialFindings,
      caseAuditData.detailedFindings
    );

    const requestData: UpdateVerificationRequest = {
      status: 'in_progress',
      verifierId: numericVerifierId,
      rating: caseAuditData.rating,
      comment: caseAuditData.comment,
      findings: findings
    };

    console.log(`[API] Saving verification data for audit ${auditId}:`, requestData);

    const response = await api.put<VerificationResponse>(
      `/audit-verification/${numericAuditId}`,
      requestData
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to save verification data');
    }

    return response.data!;
  } catch (error) {
    console.error('[API] Error saving verification data:', error);
    throw error;
  }
};

/**
 * Verify audit (mark as verified)
 */
export const verifyAuditAPI = async (
  auditId: CaseAuditId | string,
  verifierId: UserId,
  caseAuditData: CaseAuditData
): Promise<VerificationResponse> => {
  try {
    const numericAuditId = parseInt(typeof auditId === 'string' ? auditId.replace(/\D/g, '') : String(auditId).replace(/\D/g, ''));
    const numericVerifierId = parseInt(String(verifierId));

    const findings = convertFindingsToBackendFormat(
      caseAuditData.specialFindings,
      caseAuditData.detailedFindings
    );

    const requestData: UpdateVerificationRequest = {
      status: 'verified',
      verifierId: numericVerifierId,
      rating: caseAuditData.rating,
      comment: caseAuditData.comment,
      findings: findings
    };

    console.log(`[API] Verifying audit ${auditId}:`, requestData);

    const response = await api.put<VerificationResponse>(
      `/audit-verification/${numericAuditId}`,
      requestData
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to verify audit');
    }

    return response.data!;
  } catch (error) {
    console.error('[API] Error verifying audit:', error);
    throw error;
  }
};

/**
 * Reject audit
 */
export const rejectAuditAPI = async (
  auditId: CaseAuditId | string,
  verifierId: UserId,
  caseAuditData: CaseAuditData
): Promise<VerificationResponse> => {
  try {
    const numericAuditId = parseInt(typeof auditId === 'string' ? auditId.replace(/\D/g, '') : String(auditId).replace(/\D/g, ''));
    const numericVerifierId = parseInt(String(verifierId));

    const findings = convertFindingsToBackendFormat(
      caseAuditData.specialFindings,
      caseAuditData.detailedFindings
    );

    const requestData: UpdateVerificationRequest = {
      status: 'rejected',
      verifierId: numericVerifierId,
      rating: caseAuditData.rating,
      comment: caseAuditData.comment,
      findings: findings
    };

    console.log(`[API] Rejecting audit ${auditId}:`, requestData);

    const response = await api.put<VerificationResponse>(
      `/audit-verification/${numericAuditId}`,
      requestData
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to reject audit');
    }

    return response.data!;
  } catch (error) {
    console.error('[API] Error rejecting audit:', error);
    throw error;
  }
};

/**
 * Get verification data for an audit
 */
export const getAuditVerification = async (auditId: CaseAuditId | string): Promise<VerificationData | null> => {
  try {
    const numericAuditId = parseInt(typeof auditId === 'string' ? auditId.replace(/\D/g, '') : String(auditId).replace(/\D/g, ''));

    console.log(`[API] Fetching verification data for audit ${auditId}`);

    const response = await api.get<VerificationResponse>(`/audit-verification/${numericAuditId}`);

    if (!response.success) {
      console.warn(`Failed to fetch verification data: ${response.error}`);
      return null;
    }

    return response.data?.data || null;
  } catch (error) {
    console.error('[API] Error fetching verification data:', error);
    return null;
  }
}; 