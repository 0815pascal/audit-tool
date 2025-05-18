import { useMemo, useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectVerificationData, formatQuarterYear, getCurrentQuarter } from '../store/verificationSlice';
import { getAuditsByQuarter, AuditRecord } from '../services/auditService';
import { PastQuarterVerification, PastQuarterVerificationsTableProps } from '../components/past-quarter-verifications/types';

/**
 * Custom hook to get verified invoices from past quarters
 */
export const usePastQuarterVerifications = (
  employeeQuarterlyStatus: PastQuarterVerificationsTableProps['employeeQuarterlyStatus']
): PastQuarterVerification[] => {
  const verificationData = useAppSelector(selectVerificationData);
  const { quarter: currentQuarterNum, year: currentYear } = getCurrentQuarter();
  const [pastAudits, setPastAudits] = useState<AuditRecord[]>([]);
  const lastFetchedQuarterRef = useRef<string>('');

  // Fetch audits from past quarters with caching
  useEffect(() => {
    const fetchPastAudits = async () => {
      try {
        // Calculate past quarters (simple example: just the previous quarter)
        const prevQuarterNum = currentQuarterNum === 1 ? 4 : currentQuarterNum - 1;
        const prevYear = currentQuarterNum === 1 ? currentYear - 1 : currentYear;
        const prevQuarter = `Q${prevQuarterNum}-${prevYear}`;
        
        // Skip if we've already fetched this quarter
        if (prevQuarter === lastFetchedQuarterRef.current && pastAudits.length > 0) {
          return;
        }
        
        console.log(`Fetching past audits for ${prevQuarter}`);
        const auditRecords = await getAuditsByQuarter(prevQuarter);
        
        // Validate that we received an array before using it
        if (!auditRecords || !Array.isArray(auditRecords)) {
          console.error("API returned non-array data for past audits:", auditRecords);
          setPastAudits([]);
        } else {
          setPastAudits(auditRecords);
        }
        
        lastFetchedQuarterRef.current = prevQuarter;
      } catch (error) {
        console.error('Error fetching past audit records:', error);
        setPastAudits([]);
      }
    };

    fetchPastAudits();
  }, [currentQuarterNum, currentYear, pastAudits.length]);

  // Memoize the list of past quarter verifications
  return useMemo(() => {
    return Object.keys(verificationData)
      .filter(invoiceId => {
        const verification = verificationData[invoiceId];
        // Only include invoices from past quarters that are fully verified
        const isPastQuarter = verification.quarter !== currentQuarterNum || verification.year !== currentYear;
        return isPastQuarter && verification.isVerified;
      })
      .map(invoiceId => {
        // Find matching audit from API data
        const audit = pastAudits.find(a => a.auditId.toString() === invoiceId);
        const verification = verificationData[invoiceId];

        if (!audit) {
          return null;
        }

        // Get case information from the audit
        const caseObj = audit.caseObj || {};
        const claimOwner = caseObj.claimOwner || { userId: 0, role: '' };

        // Format the quarter
        const quarterKey = formatQuarterYear(verification.quarter, verification.year);

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
        const quarterlyStatus = employeeQuarterlyStatus[employeeId]?.[quarterKey] || { verified: false };

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
          isFullyVerified: verification.isVerified,
          hasIncorrectCalculations: incorrectSteps > 0,
          verificationDate: verification.verificationDate,
          quarter: quarterKey,
          progress: `${processedSteps}/${totalSteps}`,
          progressPercent: Math.round((processedSteps / totalSteps) * 100),
          quarterlyStatus,
        };
      })
      .filter(Boolean) as PastQuarterVerification[];
  }, [verificationData, currentQuarterNum, currentYear, employeeQuarterlyStatus, pastAudits]);
}; 