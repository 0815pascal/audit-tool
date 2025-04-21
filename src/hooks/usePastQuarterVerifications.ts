import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectVerificationData, formatQuarterYear, getCurrentQuarter } from '../store/verificationSlice';
import { invoices, employees } from '../mockData';
import { PastQuarterVerification, PastQuarterVerificationsTableProps } from '../components/past-quarter-verifications/types';

/**
 * Custom hook to get verified invoices from past quarters
 */
export const usePastQuarterVerifications = (
  employeeQuarterlyStatus: PastQuarterVerificationsTableProps['employeeQuarterlyStatus']
): PastQuarterVerification[] => {
  const verificationData = useAppSelector(selectVerificationData);
  const { quarter: currentQuarterNum, year: currentYear } = getCurrentQuarter();

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
        const invoice = invoices.find(inv => inv.id === invoiceId);
        const verification = verificationData[invoiceId];

        if (!invoice) {
          return null;
        }

        // Get employee name
        const employee = employees.find(emp => emp.id === invoice.employeeId) ||
                         { id: invoice.employeeId, name: 'Unknown Employee', department: '' };

        // Format the quarter
        const quarterKey = formatQuarterYear(verification.quarter, verification.year);

        // Count verified steps and incorrect steps
        const totalSteps = invoice.calculationSteps.length;
        const verifiedSteps = Object.keys(verification.steps)
          .filter(stepId => verification.steps[stepId].isVerified)
          .length;
        const incorrectSteps = Object.keys(verification.steps)
          .filter(stepId => verification.steps[stepId].isIncorrect)
          .length;

        // Calculate the number of actively processed steps (verified or incorrect)
        const processedSteps = verifiedSteps + incorrectSteps;

        // Employee quarterly verification status
        const employeeId = invoice.employeeId;
        const quarterlyStatus = employeeQuarterlyStatus[employeeId]?.[quarterKey] || { verified: false };

        return {
          id: invoice.id,
          employeeId: invoice.employeeId,
          employeeName: employee.name,
          date: invoice.date,
          clientName: invoice.clientName,
          policyNumber: invoice.policyNumber,
          caseNumber: invoice.caseNumber,
          dossierName: invoice.dossierName,
          totalAmount: invoice.totalAmount,
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
  }, [verificationData, currentQuarterNum, currentYear, employeeQuarterlyStatus]);
}; 