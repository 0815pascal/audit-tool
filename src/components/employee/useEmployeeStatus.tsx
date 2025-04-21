import { useAppSelector } from '../../store/hooks';
import { selectVerificationData, getCurrentQuarter, formatQuarterYear } from '../../store/verificationSlice';
import { VerificationStatus } from './EmployeeOption';

interface EmployeeQuarterlyStatus {
  [employeeId: string]: {
    [quarterKey: string]: {
      verified: boolean;
      lastVerified?: string;
    }
  }
}

export const useEmployeeStatus = (employeeQuarterlyStatus: EmployeeQuarterlyStatus) => {
  const verificationData = useAppSelector(selectVerificationData);
  
  // Helper function to get verification status indicator
  const getVerificationStatus = (employeeId: string): VerificationStatus => {
    // Get the current quarter and year
    const { quarter: currentQuarterNum, year: currentYear } = getCurrentQuarter();
    const quarterKey = formatQuarterYear(currentQuarterNum, currentYear);

    // Check if the employee has a verified status in the quarterly status tracker
    const employeeStatus = employeeQuarterlyStatus[employeeId];
    const isVerifiedInQuarterlyStatus = employeeStatus && 
                                        employeeStatus[quarterKey] && 
                                        employeeStatus[quarterKey].verified;

    // If already marked verified in quarterly status, determine if there are errors
    if (isVerifiedInQuarterlyStatus) {
      // Filter invoices to only include those from the current employee AND current quarter
      const employeeInvoices = Object.entries(verificationData)
        .map(([id, data]) => ({
          id,
          ...data
        }))
        .filter(invoice =>
          invoice.employeeId === employeeId &&
          invoice.quarter === currentQuarterNum &&
          invoice.year === currentYear
        );

      // Check if any verified invoices have incorrect calculations
      const hasErrors = employeeInvoices.some(invoice => {
        return Object.values(invoice.steps).some(step => step.isIncorrect);
      });

      return hasErrors ? 'verified-with-errors' : 'verified';
    }

    // Filter invoices to only include those from the current employee AND current quarter
    const employeeInvoices = Object.entries(verificationData)
      .map(([id, data]) => ({
        id,
        ...data
      }))
      .filter(invoice =>
        invoice.employeeId === employeeId &&
        invoice.quarter === currentQuarterNum &&
        invoice.year === currentYear
      );

    // If no invoices are found for this employee in the current quarter, they are unverified
    if (employeeInvoices.length === 0) {
      return 'unverified';
    }

    // Check if there are any steps actively verified or marked incorrect in current quarter
    const hasAnyActiveSteps = employeeInvoices.some(invoice =>
      Object.values(invoice.steps).some(step => step.isVerified || step.isIncorrect)
    );

    // If no steps are actively processed at all, the status is unverified
    if (!hasAnyActiveSteps) {
      return 'unverified';
    }

    // At this point, we know the employee has some progress but isn't fully verified
    return 'in-progress';
  };

  return {
    getVerificationStatus
  };
}; 