import React, { useState } from 'react';
import { useVerificationHandlers } from '../../hooks/useVerificationHandlers';
import { Dossier } from '../../types';
import { PruefensterModal } from '../common/PruefensterModal';
import QuarterlySelectionComponent from '../QuarterlySelectionComponent';

// Define VerifiedDossier interface directly to avoid dependencies
interface VerifiedDossier {
  id: string;
  userId: string;
  userName: string;
  date: string;
  clientName: string;
  policyNumber: string;
  caseNumber: number;
  dossierName: string;
  totalAmount: number;
  isFullyVerified: boolean;
  hasIncorrectCalculations: boolean;
  verificationDate: string | null;
  quarter: string;
  claimsStatus: string;
  coverageAmount: number;
  auditorCode: string;
  progress: string;
  progressPercent: number;
  quarterlyStatus: { verified: boolean };
}

// Convert VerifiedDossier to Dossier
const verifiedDossierToDossier = (verifiedDossier: VerifiedDossier): Dossier => ({
  id: verifiedDossier.id,
  userId: verifiedDossier.userId,
  date: verifiedDossier.date,
  clientName: verifiedDossier.clientName,
  policyNumber: verifiedDossier.policyNumber,
  caseNumber: verifiedDossier.caseNumber,
  dossierRisk: 0,
  dossierName: verifiedDossier.dossierName,
  totalAmount: verifiedDossier.totalAmount,
  isVerified: verifiedDossier.isFullyVerified,
  claimsStatus: (verifiedDossier.claimsStatus as 'FULL_COVER' | 'PARTIAL_COVER' | 'DECLINED' | 'PENDING'),
  coverageAmount: verifiedDossier.coverageAmount,
  verifier: verifiedDossier.auditorCode || '',
  comment: '',
  rating: '',
  specialFindings: {},
  detailedFindings: {},
  quarter: verifiedDossier.quarter,
  year: parseInt(verifiedDossier.quarter.split('-')[1]),
  isAkoReviewed: false,
  isSpecialist: false,
  caseType: 'USER_QUARTERLY'
});

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
  const { handleVerify, handleReject } = useVerificationHandlers();
  const [selectedDossier, setSelectedDossier] = useState<VerifiedDossier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVerifyDossier = (dossierId: string) => {
    if (selectedDossier) {
      const dossier = verifiedDossierToDossier(selectedDossier);
      handleVerify(
        dossierId,
        dossier.verifier || '',
        {
          comment: dossier.comment || '',
          rating: dossier.rating || '',
          specialFindings: dossier.specialFindings || {},
          detailedFindings: dossier.detailedFindings || {}
        }
      );
      setIsModalOpen(false);
      setSelectedDossier(null);
    }
  };

  const handleRejectDossier = (dossierId: string) => {
    if (selectedDossier) {
      const dossier = verifiedDossierToDossier(selectedDossier);
      handleReject(
        dossierId,
        dossier.verifier || '',
        {
          comment: dossier.comment || '',
          rating: dossier.rating || '',
          specialFindings: dossier.specialFindings || {},
          detailedFindings: dossier.detailedFindings || {}
        }
      );
      setIsModalOpen(false);
      setSelectedDossier(null);
    }
  };

  return (
    <div className="iks-tab-content">
      <QuarterlySelectionComponent />

      {selectedDossier && (
        <PruefensterModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDossier(null);
          }}
          dossier={verifiedDossierToDossier(selectedDossier)}
          onVerify={handleVerifyDossier}
          onReject={handleRejectDossier}
        />
      )}
    </div>
  );
};

export default IksTabContent; 