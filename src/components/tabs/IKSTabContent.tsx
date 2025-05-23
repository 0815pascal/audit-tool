import React, { useState } from 'react';
import { useCaseAuditHandlers } from '../../hooks/useCaseAuditHandlers';
import { 
  VerifiedAudit, 
  ClaimsStatus, 
  CaseType, 
  createEmptyFindings, 
  createPolicyId,
  ensureUserId
} from '../../types';
import {
  CaseAudit,
  CaseAuditId,
  ensureCaseAuditId
} from '../../caseAuditTypes';
import { PruefensterModal } from '../common/PruefensterModal';
import QuarterlySelectionComponent from '../QuarterlySelectionComponent';

// Convert VerifiedAudit to CaseAudit
const verifiedAuditToCaseAudit = (verifiedAudit: VerifiedAudit): CaseAudit => {
  // Safely convert policyNumber 
  let policyNum = createPolicyId(0); // Default value
  
  // We know from VerifiedAudit interface that policyNumber is of type PolicyId
  // so we can use it directly without conversion
  policyNum = verifiedAudit.policyNumber;
  
  return {
    id: verifiedAudit.id,
    userId: verifiedAudit.userId,
    date: verifiedAudit.date,
    clientName: verifiedAudit.clientName,
    policyNumber: policyNum,
    caseNumber: verifiedAudit.caseNumber,
    dossierRisk: 0,
    dossierName: verifiedAudit.dossierName,
    totalAmount: verifiedAudit.totalAmount,
    isVerified: verifiedAudit.isFullyVerified,
    claimsStatus: verifiedAudit.claimsStatus as ClaimsStatus,
    coverageAmount: verifiedAudit.coverageAmount,
    verifier: ensureUserId(verifiedAudit.auditorCode || ''),
    comment: '',
    rating: '',
    specialFindings: createEmptyFindings(),
    detailedFindings: createEmptyFindings(),
    quarter: verifiedAudit.quarter,
    year: parseInt(verifiedAudit.quarter.split('-')[1]),
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: 'USER_QUARTERLY' as CaseType
  };
};

interface IksTabContentProps {
  userQuarterlyStatus?: {
    [userId: string]: {
      [quarterKey: string]: {
        verified: boolean;
        lastVerified?: string;
      }
    }
  };
  currentQuarter?: string;
}

export const IksTabContent: React.FC<IksTabContentProps> = () => {
  const { handleVerify, handleReject } = useCaseAuditHandlers();
  const [selectedAudit, setSelectedAudit] = useState<VerifiedAudit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVerifyAudit = (auditId: CaseAuditId) => {
    if (selectedAudit) {
      const audit = verifiedAuditToCaseAudit(selectedAudit);
      handleVerify(
        auditId,
        audit.verifier,
        {
          comment: audit.comment || '',
          rating: audit.rating || '',
          specialFindings: audit.specialFindings || createEmptyFindings(),
          detailedFindings: audit.detailedFindings || createEmptyFindings()
        }
      );
      setIsModalOpen(false);
      setSelectedAudit(null);
    }
  };

  const handleRejectAudit = (auditId: CaseAuditId) => {
    if (selectedAudit) {
      const audit = verifiedAuditToCaseAudit(selectedAudit);
      handleReject(
        auditId,
        audit.verifier,
        {
          comment: audit.comment || '',
          rating: audit.rating || '',
          specialFindings: audit.specialFindings || createEmptyFindings(),
          detailedFindings: audit.detailedFindings || createEmptyFindings()
        }
      );
      setIsModalOpen(false);
      setSelectedAudit(null);
    }
  };

  // Wrapper functions to handle string IDs from modal
  const handleVerifyWrapper = (id: string | CaseAuditId) => {
    handleVerifyAudit(ensureCaseAuditId(id));
  };

  const handleRejectWrapper = (id: string | CaseAuditId) => {
    handleRejectAudit(ensureCaseAuditId(id));
  };

  return (
    <div className="iks-tab-content">
      <QuarterlySelectionComponent />

      {selectedAudit && (
        <PruefensterModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAudit(null);
          }}
          audit={verifiedAuditToCaseAudit(selectedAudit)}
          onVerify={handleVerifyWrapper}
          onReject={handleRejectWrapper}
        />
      )}
    </div>
  );
};

export default IksTabContent; 