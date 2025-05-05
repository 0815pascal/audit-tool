import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectVerificationData, getCurrentQuarter } from '../store/verificationSlice';
import { invoices, employees, auditorCodes } from '../mockData';
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

  return useMemo(() => {
    return Object.keys(verificationData)
      .filter(invoiceId => {
        const verification = verificationData[invoiceId];
        // Only include invoices from the current quarter that have verification data
        const isCurrentQuarter = verification.quarter === currentQuarterNum && verification.year === currentYear;
        return isCurrentQuarter && (verification.isVerified ||
          Object.values(verification.steps).some(step => step.isVerified || step.isIncorrect));
      })
      .map((invoiceId, index) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        const verification = verificationData[invoiceId];

        if (!invoice) {
          return null;
        }

        // Get employee name
        const employee = employees.find(emp => emp.id === invoice.employeeId) ||
                         { id: invoice.employeeId, name: 'Unknown Employee', department: '' };

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
        const quarterlyStatus = employeeQuarterlyStatus[employeeId]?.[currentQuarter] || { verified: false };

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
          coverageAmount: invoice.totalAmount,
          claimsStatus: 'FULL_COVER',
          auditorCode: auditorCodes[index % auditorCodes.length],
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
  }, [verificationData, employeeQuarterlyStatus, currentQuarter, currentQuarterNum, currentYear]);
}; 