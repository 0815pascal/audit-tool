import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Invoice } from '../types';

// Get current quarter and year
export const getCurrentQuarter = (): { quarter: number; year: number } => {
  const now = new Date();
  const month = now.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return {
    quarter,
    year: now.getFullYear()
  };
};

// Format quarter and year (e.g., "Q2-2023")
export const formatQuarterYear = (quarter: number, year: number): string => {
  return `Q${quarter}-${year}`;
};

interface VerificationState {
  verifiedInvoices: {
    [invoiceId: string]: {
      isVerified: boolean;
      verificationDate: string | null;
      employeeId: string;
      quarter: number;
      year: number;
      steps: {
        [stepId: string]: {
          isVerified: boolean;
          isIncorrect: boolean;
          comment: string;
        }
      }
    }
  };
  employeeQuarterlyStatus: {
    [employeeId: string]: {
      [quarterKey: string]: {
        verified: boolean;
        lastVerified?: string;
      }
    }
  }
}

const initialState: VerificationState = {
  verifiedInvoices: {},
  employeeQuarterlyStatus: {}
};

// This function will run on initialization to migrate any legacy data format
const migrateEmployeeQuarterlyStatus = (state: VerificationState): void => {
  // Check if we have any employee quarterly status data
  if (Object.keys(state.employeeQuarterlyStatus).length > 0) {
    // Loop through each employee
    Object.keys(state.employeeQuarterlyStatus).forEach(employeeId => {
      const employeeStatus = state.employeeQuarterlyStatus[employeeId];
      
      // If the employee has status data, check each quarter entry
      if (employeeStatus && typeof employeeStatus === 'object') {
        Object.keys(employeeStatus).forEach(quarterKey => {
          const quarterStatus = employeeStatus[quarterKey];
          
          // If the quarterly status is a boolean, convert it to the new object format
          if (typeof quarterStatus === 'boolean') {
            state.employeeQuarterlyStatus[employeeId][quarterKey] = {
              verified: quarterStatus,
              lastVerified: quarterStatus ? new Date().toISOString() : undefined
            };
          }
        });
      }
    });
  }
};

const verificationSlice = createSlice({
  name: 'verification',
  initialState,
  reducers: {
    // Initialize the state with migrated data if needed
    initializeState: (state) => {
      // Apply any migrations for backward compatibility
      migrateEmployeeQuarterlyStatus(state);
      
      // Create some sample data for past quarters if none exists
      if (Object.keys(state.verifiedInvoices).length === 0) {
        // Sample data for a past quarter
        const { quarter, year } = getCurrentQuarter();
        let pastQuarter = quarter - 1;
        let pastYear = year;
        
        if (pastQuarter < 1) {
          pastQuarter = 4;
          pastYear = year - 1;
        }
        
        // Add a sample past invoice verification for E001
        state.verifiedInvoices['INV001-PAST'] = {
          isVerified: true,
          verificationDate: new Date(pastYear, (pastQuarter - 1) * 3 + 2, 15).toISOString(),
          employeeId: '1',
          quarter: pastQuarter,
          year: pastYear,
          steps: {
            'S1': { isVerified: true, isIncorrect: false, comment: '' },
            'S2': { isVerified: true, isIncorrect: false, comment: '' }
          }
        };
        
        // Add sample for a second past quarter (two quarters ago)
        let pastQuarter2 = pastQuarter - 1;
        let pastYear2 = pastYear;
        
        if (pastQuarter2 < 1) {
          pastQuarter2 = 4;
          pastYear2 = pastYear - 1;
        }
        
        state.verifiedInvoices['INV002-PAST'] = {
          isVerified: true,
          verificationDate: new Date(pastYear2, (pastQuarter2 - 1) * 3 + 2, 10).toISOString(),
          employeeId: '2',
          quarter: pastQuarter2,
          year: pastYear2,
          steps: {
            'S1': { isVerified: true, isIncorrect: false, comment: '' },
            'S2': { isVerified: true, isIncorrect: false, comment: '' }
          }
        };
        
        // Update the quarterly status for these employees
        const quarterKey1 = formatQuarterYear(pastQuarter, pastYear);
        const quarterKey2 = formatQuarterYear(pastQuarter2, pastYear2);
        
        // Initialize if needed
        if (!state.employeeQuarterlyStatus['1']) {
          state.employeeQuarterlyStatus['1'] = {};
        }
        if (!state.employeeQuarterlyStatus['2']) {
          state.employeeQuarterlyStatus['2'] = {};
        }
        
        // Set as verified
        state.employeeQuarterlyStatus['1'][quarterKey1] = {
          verified: true,
          lastVerified: new Date(pastYear, (pastQuarter - 1) * 3 + 2, 15).toISOString()
        };
        
        state.employeeQuarterlyStatus['2'][quarterKey2] = {
          verified: true,
          lastVerified: new Date(pastYear2, (pastQuarter2 - 1) * 3 + 2, 10).toISOString()
        };
      }
    },
    verifyStep: (
      state, 
      action: PayloadAction<{ 
        invoiceId: string; 
        stepId: string; 
        isVerified: boolean;
        employeeId: string;
      }>
    ) => {
      const { invoiceId, stepId, isVerified, employeeId } = action.payload;
      const { quarter, year } = getCurrentQuarter();
      
      // Initialize invoice data if it doesn't exist
      if (!state.verifiedInvoices[invoiceId]) {
        state.verifiedInvoices[invoiceId] = {
          isVerified: false,
          verificationDate: null,
          employeeId,
          quarter,
          year,
          steps: {}
        };
      }
      
      // Initialize step data if it doesn't exist
      if (!state.verifiedInvoices[invoiceId].steps[stepId]) {
        state.verifiedInvoices[invoiceId].steps[stepId] = {
          isVerified: false,
          isIncorrect: false,
          comment: ''
        };
      }
      
      // Update step verification - if marking as verified, ensure incorrectness is turned off
      state.verifiedInvoices[invoiceId].steps[stepId].isVerified = isVerified;
      if (isVerified) {
        state.verifiedInvoices[invoiceId].steps[stepId].isIncorrect = false;
      }
    },
    
    markStepIncorrect: (
      state, 
      action: PayloadAction<{ 
        invoiceId: string; 
        stepId: string; 
        isIncorrect: boolean;
        employeeId: string;
      }>
    ) => {
      const { invoiceId, stepId, isIncorrect, employeeId } = action.payload;
      const { quarter, year } = getCurrentQuarter();
      
      // Initialize invoice data if it doesn't exist
      if (!state.verifiedInvoices[invoiceId]) {
        state.verifiedInvoices[invoiceId] = {
          isVerified: false,
          verificationDate: null,
          employeeId,
          quarter,
          year,
          steps: {}
        };
      }
      
      // Initialize step data if it doesn't exist
      if (!state.verifiedInvoices[invoiceId].steps[stepId]) {
        state.verifiedInvoices[invoiceId].steps[stepId] = {
          isVerified: false,
          isIncorrect: false,
          comment: ''
        };
      }
      
      // Update step incorrectness - if marking as incorrect, ensure verification is turned off
      state.verifiedInvoices[invoiceId].steps[stepId].isIncorrect = isIncorrect;
      if (isIncorrect) {
        state.verifiedInvoices[invoiceId].steps[stepId].isVerified = false;
      }
    },
    
    addStepComment: (
      state, 
      action: PayloadAction<{ 
        invoiceId: string; 
        stepId: string; 
        comment: string;
        employeeId: string;
      }>
    ) => {
      const { invoiceId, stepId, comment, employeeId } = action.payload;
      const { quarter, year } = getCurrentQuarter();
      
      // Initialize invoice data if it doesn't exist
      if (!state.verifiedInvoices[invoiceId]) {
        state.verifiedInvoices[invoiceId] = {
          isVerified: false,
          verificationDate: null,
          employeeId,
          quarter,
          year,
          steps: {}
        };
      }
      
      // Initialize step data if it doesn't exist
      if (!state.verifiedInvoices[invoiceId].steps[stepId]) {
        state.verifiedInvoices[invoiceId].steps[stepId] = {
          isVerified: false,
          isIncorrect: false,
          comment: ''
        };
      }
      
      // Update step comment
      state.verifiedInvoices[invoiceId].steps[stepId].comment = comment;
    },
    
    verifyInvoice: (
      state, 
      action: PayloadAction<{ 
        invoiceId: string; 
        isVerified: boolean;
        employeeId: string;
      }>
    ) => {
      const { invoiceId, isVerified, employeeId } = action.payload;
      const { quarter, year } = getCurrentQuarter();
      const quarterKey = formatQuarterYear(quarter, year);
      
      // Initialize invoice data if it doesn't exist
      if (!state.verifiedInvoices[invoiceId]) {
        state.verifiedInvoices[invoiceId] = {
          isVerified: false,
          verificationDate: null,
          employeeId,
          quarter,
          year,
          steps: {}
        };
      }
      
      // Update invoice verification
      state.verifiedInvoices[invoiceId].isVerified = isVerified;
      
      // Update verification date and verifier if verified
      if (isVerified) {
        state.verifiedInvoices[invoiceId].verificationDate = new Date().toISOString();
        
        // Update employee quarterly status
        if (!state.employeeQuarterlyStatus[employeeId]) {
          state.employeeQuarterlyStatus[employeeId] = {};
        }
        if (!state.employeeQuarterlyStatus[employeeId][quarterKey]) {
          state.employeeQuarterlyStatus[employeeId][quarterKey] = {
            verified: false
          };
        }
        state.employeeQuarterlyStatus[employeeId][quarterKey] = {
          verified: true,
          lastVerified: new Date().toISOString()
        };
      } else {
        // If marking as unverified/in progress
        state.verifiedInvoices[invoiceId].verificationDate = null;
        
        // Check if all current quarter invoices for this employee are verified
        const employeeCurrentQuarterInvoices = Object.values(state.verifiedInvoices)
          .filter(invoice => 
            invoice.employeeId === employeeId && 
            invoice.quarter === quarter && 
            invoice.year === year
          );
        
        const anyRemainingVerifiedInvoices = employeeCurrentQuarterInvoices.some(
          invoice => Object.keys(state.verifiedInvoices).includes(invoiceId) && 
            invoice !== state.verifiedInvoices[invoiceId] && 
            invoice.isVerified
        );
        
        // Only update employee status if there are no other verified invoices
        if (!anyRemainingVerifiedInvoices && state.employeeQuarterlyStatus[employeeId]?.[quarterKey]) {
          state.employeeQuarterlyStatus[employeeId][quarterKey].verified = false;
        }
      }
    }
  }
});

export const { initializeState, verifyStep, markStepIncorrect, addStepComment, verifyInvoice } = verificationSlice.actions;

// Selectors
export const selectVerificationData = (state: { verification: VerificationState }) => 
  state.verification.verifiedInvoices;

export const selectEmployeeQuarterlyStatus = (state: { verification: VerificationState }) =>
  state.verification.employeeQuarterlyStatus;

// Define the Employee interface to match what the component expects
interface Employee {
  id: string;
  name: string;
  department: string;
}

// Memoized selector for employees needing verification
export const selectEmployeesNeedingVerification = createSelector(
  [
    (state: { verification: VerificationState }) => state.verification.verifiedInvoices,
    (state: { verification: VerificationState }) => state.verification.employeeQuarterlyStatus, 
    (_state, employees: Employee[]) => employees
  ],
  (verifiedInvoices, employeeQuarterlyStatus, employees) => {
    const { quarter, year } = getCurrentQuarter();
    const quarterKey = formatQuarterYear(quarter, year);
    
    return employees.filter(employee => {
      const employeeId = employee.id;
      
      // First approach: check employeeQuarterlyStatus
      const employeeStatus = employeeQuarterlyStatus[employeeId];
      if (!employeeStatus || !employeeStatus[quarterKey] || !employeeStatus[quarterKey].verified) {
        return true; // Employee needs verification
      }
      
      // Double-check: ensure all current quarter invoices are verified
      // Find all invoices for this employee from the current quarter
      const employeeInvoices = Object.values(verifiedInvoices)
        .filter(invoice => 
          invoice.employeeId === employeeId && 
          invoice.quarter === quarter && 
          invoice.year === year
        );
      
      // If there are no invoices for this quarter, they need verification
      if (employeeInvoices.length === 0) {
        return true;
      }
      
      // Check if all invoices are verified
      const allInvoicesVerified = employeeInvoices.every(invoice => invoice.isVerified);
      
      // If any current quarter invoice is not fully verified, this employee needs verification
      return !allInvoicesVerified;
    });
  }
);

// Apply verification data to an invoice
export const applyVerificationDataToInvoice = (
  invoice: Invoice, 
  verificationData: VerificationState['verifiedInvoices']
): Invoice => {
  // Find the verification data for this invoice
  const invoiceVerification = verificationData[invoice.id];
  
  if (!invoiceVerification) return invoice;
  
  // Create a deep copy of the invoice with verification data applied
  const updatedInvoice = {
    // Include original invoice data plus mock claims/coverage
    ...invoice,
    claimsStatus: (invoice as any).claimsStatus ?? 'FULL_COVER',
    coverageAmount: (invoice as any).coverageAmount ?? invoice.totalAmount,
    isVerified: invoiceVerification.isVerified,
    calculationSteps: invoice.calculationSteps.map(step => {
      // Find the verification data for this step
      const stepVerification = invoiceVerification.steps[step.id];
      
      if (!stepVerification) return step;
      
      // Apply verification data to the step
      return {
        ...step,
        isVerified: stepVerification.isVerified,
        isIncorrect: stepVerification.isIncorrect,
        comment: stepVerification.comment
      };
    })
  };
  
  return updatedInvoice;
};

export default verificationSlice.reducer; 