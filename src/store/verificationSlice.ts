import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice, CalculationStep } from '../types';

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

// Format quarter and year (e.g., "Q2 2023")
export const formatQuarterYear = (quarter: number, year: number): string => {
  return `Q${quarter} ${year}`;
};

interface VerificationState {
  verifiedInvoices: {
    [invoiceId: string]: {
      isVerified: boolean;
      verifiedBy: string;
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
const migrateEmployeeQuarterlyStatus = (state: VerificationState): VerificationState => {
  const updatedState = { ...state };
  
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
            updatedState.employeeQuarterlyStatus[employeeId][quarterKey] = {
              verified: quarterStatus,
              lastVerified: quarterStatus ? new Date().toISOString() : undefined
            };
          }
        });
      }
    });
  }
  
  return updatedState;
};

export const verificationSlice = createSlice({
  name: 'verification',
  initialState,
  reducers: {
    // Initialize the state with migrated data if needed
    initializeState: (state) => {
      const migratedState = migrateEmployeeQuarterlyStatus(state);
      return migratedState;
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
          verifiedBy: 'Supervisor',
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
          verifiedBy: 'Supervisor',
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
          verifiedBy: 'Supervisor',
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
          verifiedBy: 'Supervisor',
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
        state.verifiedInvoices[invoiceId].verificationDate = null;
        
        // Remove quarterly verification if it matches this quarter
        if (
          state.employeeQuarterlyStatus[employeeId] &&
          state.employeeQuarterlyStatus[employeeId][quarterKey]
        ) {
          state.employeeQuarterlyStatus[employeeId][quarterKey] = {
            verified: false
          };
        }
      }
    }
  }
});

export const { initializeState, verifyStep, markStepIncorrect, addStepComment, verifyInvoice } = verificationSlice.actions;

// Selectors
export const selectVerificationData = (state: { verification: VerificationState }) => 
  state.verification.verifiedInvoices;

export const selectInvoiceVerification = (state: { verification: VerificationState }, invoiceId: string) => 
  state.verification.verifiedInvoices[invoiceId];

export const selectEmployeeQuarterlyStatus = (state: { verification: VerificationState }) =>
  state.verification.employeeQuarterlyStatus;

export const selectEmployeeVerificationStatus = (
  state: { verification: VerificationState }, 
  employeeId: string,
  quarter?: number,
  year?: number
) => {
  const currentPeriod = getCurrentQuarter();
  const q = quarter || currentPeriod.quarter;
  const y = year || currentPeriod.year;
  const quarterKey = formatQuarterYear(q, y);
  
  const employeeStatus = state.verification.employeeQuarterlyStatus[employeeId];
  return employeeStatus ? employeeStatus[quarterKey] || false : false;
};

// Check which employees need verification this quarter
export const selectEmployeesNeedingVerification = (state: { verification: VerificationState }, employees: { id: string }[]) => {
  const { quarter, year } = getCurrentQuarter();
  const quarterKey = formatQuarterYear(quarter, year);
  
  return employees.filter(employee => {
    const employeeStatus = state.verification.employeeQuarterlyStatus[employee.id];
    return !employeeStatus || !employeeStatus[quarterKey];
  });
};

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
    ...invoice,
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