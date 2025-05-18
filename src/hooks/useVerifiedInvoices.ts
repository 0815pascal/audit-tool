import { useMemo, useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectVerificationData, getCurrentQuarter } from '../store/verificationSlice';
import { getAuditsByQuarter, AuditRecord } from '../services/auditService';
import { VerifiedInvoice, VerifiedInvoicesTableProps } from '../components/verified-invoices/types';

/**
 * Custom hook to get verified invoices for the current quarter
 */
export const useVerifiedInvoices = (
  employeeQuarterlyStatus: VerifiedInvoicesTableProps['employeeQuarterlyStatus'],
  currentQuarter: string
): VerifiedInvoice[] => {
  const verificationData = useAppSelector(selectVerificationData);
  const { quarter: currentQuarterNum, year: currentYear } = getCurrentQuarter();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const lastFetchedQuarterRef = useRef<string>('');

  // Fetch audits from API with caching
  useEffect(() => {
    const fetchAudits = async () => {
      // Skip if we've already fetched this quarter's data
      if (currentQuarter === lastFetchedQuarterRef.current && audits.length > 0) {
        return;
      }
      
      try {
        // Format the quarter parameter to ensure it uses a hyphen instead of a space
        const formattedQuarter = currentQuarter.replace(/\s+/g, '-');
        
        console.log(`Fetching audits for ${formattedQuarter}`);
        const auditRecords = await getAuditsByQuarter(formattedQuarter);
        
        // Validate that we received an array before using it
        if (!auditRecords || !Array.isArray(auditRecords)) {
          console.error("API returned non-array data for audits:", auditRecords);
          setAudits([]);
        } else {
          setAudits(auditRecords);
        }
        
        lastFetchedQuarterRef.current = currentQuarter;
      } catch (error) {
        console.error('Error fetching audit records:', error);
        setAudits([]);
      }
    };

    fetchAudits();
  }, [currentQuarter, audits.length]);

  return useMemo(() => {
    return Object.keys(verificationData)
      .filter(invoiceId => {
        const verification = verificationData[invoiceId];
        // Only include invoices from the current quarter that have verification data
        const isCurrentQuarter = verification.quarter === currentQuarterNum && verification.year === currentYear;
        return isCurrentQuarter && (verification.isVerified ||
          Object.values(verification.steps).some(step => step.isVerified || step.isIncorrect));
      })
      .map((invoiceId) => {
        // Find matching audit from API data
        const audit = audits.find(a => a.auditId.toString() === invoiceId);
        const verification = verificationData[invoiceId];

        if (!audit) {
          return null;
        }

        // Get case information from the audit
        const caseObj = audit.caseObj || {};
        const claimOwner = caseObj.claimOwner || { userId: 0, role: '' };
        
        // Count verified steps and incorrect steps
        const totalSteps = 4; // Default number of steps
        const verifiedSteps = Object.keys(verification.steps)
          .filter(stepId => verification.steps[stepId].isVerified)
          .length;
        const incorrectSteps = Object.keys(verification.steps)
          .filter(stepId => verification.steps[stepId].isIncorrect)
          .length;

        // Calculate the number of actively processed steps (verified or incorrect)
        const processedSteps = verifiedSteps + incorrectSteps;

        // Employee quarterly verification status
        const employeeId = claimOwner.userId.toString();
        const quarterlyStatus = employeeQuarterlyStatus[employeeId]?.[currentQuarter] || { verified: false };

        return {
          id: invoiceId,
          employeeId: employeeId,
          employeeName: claimOwner.role || 'Unknown',
          date: new Date().toISOString().split('T')[0], // Use current date as fallback
          clientName: caseObj.claimOwner?.role || 'Unknown Client',
          policyNumber: `POL-${caseObj.caseNumber || '0000'}`,
          caseNumber: caseObj.caseNumber || 0,
          dossierName: `Case ${caseObj.caseNumber || '0000'}`,
          totalAmount: caseObj.coverageAmount || 0,
          coverageAmount: caseObj.coverageAmount || 0,
          claimsStatus: caseObj.claimsStatus || 'FULL_COVER',
          auditorCode: `${audit.auditor?.userId || 'XX'}`,
          isFullyVerified: verification.isVerified,
          hasIncorrectCalculations: incorrectSteps > 0,
          verificationDate: verification.verificationDate,
          quarter: currentQuarter,
          progress: `${processedSteps}/${totalSteps}`,
          progressPercent: Math.round((processedSteps / totalSteps) * 100),
          quarterlyStatus,
        };
      })
      .filter(Boolean) as VerifiedInvoice[];
  }, [verificationData, employeeQuarterlyStatus, currentQuarter, currentQuarterNum, currentYear, audits]);
}; 