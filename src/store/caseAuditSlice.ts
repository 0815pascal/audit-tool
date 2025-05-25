import { createSlice, PayloadAction, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  UserRole, 
  RatingValue, 
  StepActionPayload,
  StatusUpdatePayload,
  AuditForSelection,
  UserAuditForSelection,
  createEmptyFindings,
  createValidYear,
  createUserId,
  createISODateString,
  QuarterPeriod,
  QuarterNumber,
  Quarter,
  formatQuarterPeriod,
  User,
  ApiResponse,
  ApiSuccessResponse
} from '../types';
import { VERIFICATION_STATUS_ENUM, CASE_TYPE_ENUM, CLAIMS_STATUS_ENUM, USER_ROLE_ENUM } from '../enums';
import { QUARTER_CALCULATIONS } from '../constants';
import { 
  createCaseAuditId,
  CaseAuditStep,
  StoredCaseAuditData,
  CaseAudit,
  CaseAuditSummary,
  CaseAuditActionPayload,
  VerifyAuditActionPayload,
  CaseAuditState
} from '../caseAuditTypes';
import { mapVerificationStatusToCaseAuditStatus } from '../utils/statusUtils';
import { ensureUserId } from '../types';
import { 
  saveAuditVerification, 
  verifyAuditAPI, 
  rejectAuditAPI,
  VerificationResponse 
} from '../services/auditVerificationService';

// Memoize the getCurrentQuarter function to avoid creating new objects on each call
let cachedQuarter: Quarter | null = null;
let lastUpdateTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Get current quarter and year - memoized to prevent returning new objects on each call
export const getCurrentQuarter = (): Quarter => {
  const now = new Date();
  const currentTime = now.getTime();
  
  // Only recalculate if the cache has expired or doesn't exist
  if (!cachedQuarter || (currentTime - lastUpdateTime) > CACHE_TTL) {
    const month = now.getMonth();
    const quarterValue = Math.floor(month / QUARTER_CALCULATIONS.MONTHS_PER_QUARTER) + QUARTER_CALCULATIONS.QUARTER_OFFSET;
    // Type assertion to ensure it's a valid QuarterNumber (1-4)
    const quarter = (quarterValue > 0 && quarterValue <= 4 ? quarterValue : 1) as QuarterNumber;
    
    cachedQuarter = {
      quarter,
      year: createValidYear(now.getFullYear())
    };
    lastUpdateTime = currentTime;
  }
  
  return cachedQuarter as Quarter;
};

// Format quarter and year (e.g., "Q2-2023")
export const formatQuarterYear = (quarter: QuarterNumber, year: number): QuarterPeriod => {
  return `Q${quarter}-${year}`;
};

// Using utility function for status mapping from utils/statusUtils.ts

// Extended version of StoredCaseAuditData with additional fields for backward compatibility
interface ExtendedStoredCaseAuditData extends StoredCaseAuditData {
  lastUpdated?: string;
}

// Initialize a proper version of CaseAuditState
const initialState: CaseAuditState = {
  verifiedAudits: {},
  userQuarterlyStatus: {},
  userRoles: {}, // Remove mock data - this should be populated from API
  currentUserId: createUserId(''), // No default user - should be fetched from API
  quarterlySelection: {} // For backward compatibility
};

// Create a default StoredCaseAuditData object with standard values
const createDefaultCaseAuditData = (userId: string): StoredCaseAuditData => {
  const { quarter, year } = getCurrentQuarter();
  
  const data: ExtendedStoredCaseAuditData = {
    isVerified: false,
    isIncorrect: false, // Required by StoredCaseAuditData
    verificationDate: null,
    userId: createUserId(userId),
    quarter: formatQuarterPeriod(quarter, year),
    year,
    steps: {},
    verifier: createUserId(''),
    comment: '',
    rating: '' as RatingValue,
    specialFindings: createEmptyFindings(),
    detailedFindings: createEmptyFindings(),
    status: mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.NOT_VERIFIED),
    caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
    coverageAmount: 0,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    isAkoReviewed: false,
    dossierName: 'Default Dossier'
  };
  
  return data;
};

// Create step object with proper id
const createStepWithId = (stepId: string, isVerified: boolean = false, isIncorrect: boolean = false, comment: string = ''): CaseAuditStep => {
  return {
    id: stepId,
    isVerified,
    isIncorrect,
    comment
  };
};

// This function will run on initialization to migrate any legacy data format
const migrateUserQuarterlyStatus = (state: CaseAuditState): void => {
  // Check if we have any user quarterly status data
  if (Object.keys(state.userQuarterlyStatus).length > 0) {
    // Loop through each user
    Object.keys(state.userQuarterlyStatus).forEach(userId => {
      const userStatus = state.userQuarterlyStatus[userId];
      
      // If the user has status data, check each quarter entry
      if (userStatus && typeof userStatus === 'object') {
        Object.keys(userStatus).forEach(quarterKey => {
          const quarterStatus = userStatus[quarterKey];
          
          // If the quarterly status is a boolean, convert it to the new object format
          if (typeof quarterStatus === 'boolean') {
            state.userQuarterlyStatus[userId][quarterKey] = {
              verified: quarterStatus,
              lastVerified: quarterStatus ? createISODateString() : undefined
            };
          }
        });
      }
    });
  }
};

// Create async thunk for fetching current user
export const fetchCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  'caseAudit/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/current-user');
      const data = await response.json() as ApiResponse<User>;
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch current user');
      }
      
      return (data as ApiSuccessResponse<User>).data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch current user');
    }
  }
);

// Async thunk for saving audit verification data (in-progress)
export const saveAuditVerificationThunk = createAsyncThunk<
  VerificationResponse,
  CaseAuditActionPayload,
  { rejectValue: string }
>(
  'caseAudit/saveAuditVerification',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await saveAuditVerification(
        payload.auditId,
        payload.verifier,
        {
          comment: payload.comment,
          rating: payload.rating,
          specialFindings: payload.specialFindings,
          detailedFindings: payload.detailedFindings
        }
      );
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save verification data');
    }
  }
);

// Async thunk for verifying audit
export const verifyAuditThunk = createAsyncThunk<
  VerificationResponse,
  VerifyAuditActionPayload,
  { rejectValue: string }
>(
  'caseAudit/verifyAudit',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await verifyAuditAPI(
        payload.auditId,
        payload.verifier,
        {
          comment: payload.comment,
          rating: payload.rating,
          specialFindings: payload.specialFindings,
          detailedFindings: payload.detailedFindings
        }
      );
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to verify audit');
    }
  }
);

// Async thunk for rejecting audit
export const rejectAuditThunk = createAsyncThunk<
  VerificationResponse,
  CaseAuditActionPayload,
  { rejectValue: string }
>(
  'caseAudit/rejectAudit',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await rejectAuditAPI(
        payload.auditId,
        payload.verifier,
        {
          comment: payload.comment,
          rating: payload.rating,
          specialFindings: payload.specialFindings,
          detailedFindings: payload.detailedFindings
        }
      );
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to reject audit');
    }
  }
);

const caseAuditSlice = createSlice({
  name: 'caseAudit',
  initialState,
  reducers: {
    // Initialize the state with migrated data if needed
    initializeState: (state) => {
      // Apply any migrations for backward compatibility
      migrateUserQuarterlyStatus(state);
      
      // Create some sample data for past quarters if none exists
      if (Object.keys(state.verifiedAudits).length === 0) {
        // Sample data for a past quarter
        const { quarter, year } = getCurrentQuarter();
        let pastQuarterValue = quarter - 1;
        let pastYear = year;
        
        if (pastQuarterValue < 1) {
          pastQuarterValue = 4;
          pastYear = createValidYear(year.valueOf() - 1);
        }
        
        // Cast to QuarterNumber type
        const pastQuarter = pastQuarterValue as QuarterNumber;
        
        // Add a sample past dossier verification for U001
        const pastDossier1: StoredCaseAuditData = {
          isVerified: true,
          isIncorrect: false,
          verificationDate: createISODateString(new Date(pastYear, (pastQuarter - 1) * 3 + 2, 15)),
          userId: createUserId('1'),
          quarter: formatQuarterPeriod(pastQuarter, pastYear),
          year: pastYear,
          steps: {
            'S1': createStepWithId('S1', true, false, ''),
            'S2': createStepWithId('S2', true, false, '')
          },
          verifier: createUserId(''),
          comment: '',
          rating: '',
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          status: mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.VERIFIED),
          caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
          coverageAmount: 0,
          claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
          dossierName: 'Sample Past Dossier 1'
        };
        
        state.verifiedAudits['INV001-PAST'] = pastDossier1;
        
        // Add sample for a second past quarter (two quarters ago)
        let pastQuarter2Value = pastQuarterValue - 1;
        let pastYear2 = pastYear;
        
        if (pastQuarter2Value < 1) {
          pastQuarter2Value = 4;
          pastYear2 = createValidYear(pastYear.valueOf() - 1);
        }
        
        // Cast to QuarterNumber type
        const pastQuarter2 = pastQuarter2Value as QuarterNumber;
        
        const pastDossier2: StoredCaseAuditData = {
          isVerified: true,
          isIncorrect: false,
          verificationDate: createISODateString(new Date(pastYear2.valueOf(), (pastQuarter2 - 1) * 3 + 2, 10)),
          userId: createUserId('2'),
          quarter: formatQuarterPeriod(pastQuarter2, pastYear2),
          year: pastYear2,
          steps: {
            'S1': createStepWithId('S1', true, false, ''),
            'S2': createStepWithId('S2', true, false, '')
          },
          verifier: createUserId(''),
          comment: '',
          rating: '',
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          status: mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.VERIFIED),
          caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
          coverageAmount: 0,
          claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
          dossierName: 'Sample Past Dossier 2'
        };
        
        state.verifiedAudits['INV002-PAST'] = pastDossier2;
        
        // Update the quarterly status for these users
        const quarterKey1 = formatQuarterYear(pastQuarter, pastYear);
        const quarterKey2 = formatQuarterYear(pastQuarter2, pastYear2);
        
        // Initialize if needed
        if (!state.userQuarterlyStatus['1']) {
          state.userQuarterlyStatus['1'] = {};
        }
        if (!state.userQuarterlyStatus['2']) {
          state.userQuarterlyStatus['2'] = {};
        }
        
        // Set as verified
        state.userQuarterlyStatus['1'][quarterKey1] = {
          verified: true,
          lastVerified: createISODateString(new Date(pastYear.valueOf(), (pastQuarter - 1) * 3 + 2, 15))
        };
        
        state.userQuarterlyStatus['2'][quarterKey2] = {
          verified: true,
          lastVerified: createISODateString(new Date(pastYear2.valueOf(), (pastQuarter2 - 1) * 3 + 2, 10))
        };
        
        // Add quarterlySelection entry for Q1-2025
        if (!state.quarterlySelection[quarterKey1]) {
          state.quarterlySelection[quarterKey1] = {
            quarterKey: quarterKey1,
            userQuarterlyAudits: [createCaseAuditId('INV001-PAST')],
            previousQuarterRandomAudits: [],
            lastSelectionDate: createISODateString(new Date(pastYear.valueOf(), (pastQuarter - 1) * 3 + 2, 15))
          };
        }
      }
    },
    verifyStep: (
      state, 
      action: PayloadAction<StepActionPayload & { isVerified: boolean }>
    ) => {
      const { auditId, stepId, isVerified, userId } = action.payload;
      
      // Initialize audit data if it doesn't exist
      if (!state.verifiedAudits[auditId]) {
        state.verifiedAudits[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Initialize step data if it doesn't exist
      if (!state.verifiedAudits[auditId].steps[stepId]) {
        state.verifiedAudits[auditId].steps[stepId] = createStepWithId(stepId, false, false, '');
      }
      
      // Update step verification - if marking as verified, ensure incorrectness is turned off
      state.verifiedAudits[auditId].steps[stepId].isVerified = isVerified;
      if (isVerified) {
        state.verifiedAudits[auditId].steps[stepId].isIncorrect = false;
      }
    },
    
    markStepIncorrect: (
      state, 
      action: PayloadAction<StepActionPayload & { isIncorrect: boolean }>
    ) => {
      const { auditId, stepId, isIncorrect, userId } = action.payload;
      
      // Initialize audit data if it doesn't exist
      if (!state.verifiedAudits[auditId]) {
        state.verifiedAudits[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Initialize step data if it doesn't exist
      if (!state.verifiedAudits[auditId].steps[stepId]) {
        state.verifiedAudits[auditId].steps[stepId] = createStepWithId(stepId, false, false, '');
      }
      
      // Update step incorrectness - if marking as incorrect, ensure verification is turned off
      state.verifiedAudits[auditId].steps[stepId].isIncorrect = isIncorrect;
      if (isIncorrect) {
        state.verifiedAudits[auditId].steps[stepId].isVerified = false;
      }
    },
    
    updateStepComment: (
      state, 
      action: PayloadAction<StepActionPayload & { comment: string }>
    ) => {
      const { auditId, stepId, comment, userId } = action.payload;
      
      // Initialize audit data if it doesn't exist
      if (!state.verifiedAudits[auditId]) {
        state.verifiedAudits[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Initialize step data if it doesn't exist
      if (!state.verifiedAudits[auditId].steps[stepId]) {
        state.verifiedAudits[auditId].steps[stepId] = createStepWithId(stepId, false, false, '');
      }
      
      // Update step comment
      state.verifiedAudits[auditId].steps[stepId].comment = comment;
    },
    
    verifyAudit: (
      state, 
      action: PayloadAction<VerifyAuditActionPayload>
    ) => {
      const { auditId, isVerified, userId, verifier, comment, rating, specialFindings, detailedFindings } = action.payload;
      const { quarter, year } = getCurrentQuarter();
      const quarterKey = formatQuarterYear(quarter, year);
      
      // Initialize audit data if it doesn't exist
      if (!state.verifiedAudits[auditId]) {
        state.verifiedAudits[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Update audit verification
      state.verifiedAudits[auditId].isVerified = isVerified;
      state.verifiedAudits[auditId].verifier = verifier;
      state.verifiedAudits[auditId].comment = comment;
      state.verifiedAudits[auditId].rating = rating;
      state.verifiedAudits[auditId].specialFindings = specialFindings;
      state.verifiedAudits[auditId].detailedFindings = detailedFindings;
      
      // Update verification date and verifier if verified
      if (isVerified) {
        state.verifiedAudits[auditId].verificationDate = createISODateString(new Date());
        // Explicitly set status to 'verified'
        state.verifiedAudits[auditId].status = mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.VERIFIED);
        
        // Update user quarterly status
        if (!state.userQuarterlyStatus[userId]) {
          state.userQuarterlyStatus[userId] = {};
        }
        if (!state.userQuarterlyStatus[userId][quarterKey]) {
          state.userQuarterlyStatus[userId][quarterKey] = {
            verified: false
          };
        }
        state.userQuarterlyStatus[userId][quarterKey] = {
          verified: true,
          lastVerified: createISODateString(new Date())
        };
      } else {
        // If marking as unverified/in progress
        state.verifiedAudits[auditId].verificationDate = null;
        
        // Filter audits for the current quarter
        const userCurrentQuarterAudits = Object.values(state.verifiedAudits)
          .filter(audit => {
            // First check if the userId matches
            if (audit.userId !== userId) return false;
            
            // Convert the stored quarter string to quarter/year values for comparison
            const parts = (audit.quarter as string).split('-');
            if (parts.length === 2) {
              const auditQuarter = parseInt(parts[0].substring(1));
              const auditYear = parseInt(parts[1]);
              
              // Now compare with the current quarter and year
              return auditQuarter === quarter && auditYear === year;
            }
            
            return false;
          });
        
        // Check if any other audits for this user in this quarter are still verified
        const anyRemainingVerifiedAudits = userCurrentQuarterAudits.some(
          audit => 
            Object.keys(state.verifiedAudits).includes(auditId) && 
            audit !== state.verifiedAudits[auditId] && 
            audit.isVerified
        );
        
        // Only update user status if there are no other verified audits
        if (!anyRemainingVerifiedAudits && state.userQuarterlyStatus[userId]?.[quarterKey]) {
          state.userQuarterlyStatus[userId][quarterKey].verified = false;
        }
      }
    },
    rejectAudit: (
      state, 
      action: PayloadAction<CaseAuditActionPayload>
    ) => {
      const { auditId, userId, verifier, comment, rating, specialFindings, detailedFindings } = action.payload;
      
      // Initialize audit data if it doesn't exist
      if (!state.verifiedAudits[auditId]) {
        state.verifiedAudits[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Update audit verification
      state.verifiedAudits[auditId].isVerified = false;
      state.verifiedAudits[auditId].verifier = verifier;
      state.verifiedAudits[auditId].comment = comment;
      state.verifiedAudits[auditId].rating = rating;
      state.verifiedAudits[auditId].specialFindings = specialFindings;
      state.verifiedAudits[auditId].detailedFindings = detailedFindings;
      // Explicitly set status to 'not-verified'
      state.verifiedAudits[auditId].status = mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.NOT_VERIFIED);
    },
    updateAuditStatus: (
      state,
      action: PayloadAction<StatusUpdatePayload>
    ) => {
      const { auditId, status, userId } = action.payload;
      
      // Initialize audit data if it doesn't exist
      if (!state.verifiedAudits[auditId]) {
        state.verifiedAudits[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Update audit status - directly set status since both enums have the same string values
      state.verifiedAudits[auditId].status = status;
      
      // Update isVerified based on the status value
      state.verifiedAudits[auditId].isVerified = status === 'verified';
    },
    // Select audits for quarterly verification
    selectQuarterlyAudits: (
      state,
      action: PayloadAction<{
        quarterKey: string;
        userQuarterlyAudits: UserAuditForSelection[];
        previousQuarterRandomAudits: AuditForSelection[];
      }>
    ) => {
      const { quarterKey, userQuarterlyAudits, previousQuarterRandomAudits } = action.payload;
      
      // Parse quarter and year from quarterKey
      const [quarterStr, yearStr] = quarterKey.split('-');
      const quarterValue = parseInt(quarterStr.replace('Q', ''));
      const year = parseInt(yearStr);
      
      // Ensure quarter is a valid QuarterNumber (1-4)
      const quarter = (quarterValue > 0 && quarterValue <= 4 ? quarterValue : 1) as QuarterNumber;
      
      // Store the quarterly selection
      state.quarterlySelection[quarterKey] = {
        quarterKey: quarterKey,
        userQuarterlyAudits: userQuarterlyAudits.map(a => a.auditId),
        previousQuarterRandomAudits: previousQuarterRandomAudits.map(a => a.auditId),
        lastSelectionDate: createISODateString(new Date())
      };
      
      // Add the audits to verification state
      userQuarterlyAudits.forEach(audit => {
        const claimsStatus = audit.claimsStatus ? 
          (audit.claimsStatus as CLAIMS_STATUS_ENUM) : 
          CLAIMS_STATUS_ENUM.FULL_COVER;
          
        // MSW adds quarter and year properties - use type assertion
        const auditWithQuarter = audit as AuditForSelection & { quarter?: string; year?: number; notifiedCurrency?: string };
        
        const newAudit: StoredCaseAuditData = {
          isVerified: false,
          isIncorrect: false,
          verificationDate: null,
          userId: audit.userId,
          quarter: auditWithQuarter.quarter || formatQuarterPeriod(quarter, year), // Use audit's quarter or fallback
          year: auditWithQuarter.year || year, // Use audit's year or fallback
          steps: {},
          verifier: createUserId(''),
          comment: '',
          rating: '' as RatingValue,
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          status: mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.NOT_VERIFIED),
          caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
          coverageAmount: audit.coverageAmount,
          claimsStatus: claimsStatus,
          dossierName: `Audit ${audit.auditId}`,
          notifiedCurrency: auditWithQuarter.notifiedCurrency || 'CHF' // Include currency from audit
        };
        
        state.verifiedAudits[audit.auditId] = newAudit;
      });
      
      // Add the random previous quarter audits
      previousQuarterRandomAudits.forEach(audit => {
        // MSW adds quarter and year properties - use type assertion
        const auditWithQuarter = audit as AuditForSelection & { quarter?: string; year?: number; notifiedCurrency?: string };
        
        const newRandomAudit: StoredCaseAuditData = {
          isVerified: false,
          isIncorrect: false,
          verificationDate: null,
          userId: ensureUserId(audit.userId), // Use the actual userId from the audit
          quarter: auditWithQuarter.quarter || formatQuarterPeriod(quarter, year), // Use audit's quarter or fallback
          year: auditWithQuarter.year || year, // Use audit's year or fallback
          steps: {},
          verifier: createUserId(''),
          comment: '',
          rating: '' as RatingValue,
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          status: mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.NOT_VERIFIED),
          caseType: CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM,
          coverageAmount: audit.coverageAmount,
          claimsStatus: audit.claimsStatus as CLAIMS_STATUS_ENUM || CLAIMS_STATUS_ENUM.FULL_COVER,
          dossierName: `Random Audit ${audit.auditId}`,
          notifiedCurrency: auditWithQuarter.notifiedCurrency || 'CHF' // Include currency from audit
        };
        
        state.verifiedAudits[audit.auditId] = newRandomAudit;
      });
    },
    
    // Update user roles
    updateUserRole: (
      state,
      action: PayloadAction<{
        userId: string;
        role: UserRole;
        department: string;
      }>
    ) => {
      const { userId, role, department } = action.payload;
      
      // Update or create the user role
      state.userRoles[userId] = {
        role,
        department
      };
    },
    // Add new action to handle in-progress verification state
    updateAuditInProgress: (
      state,
      action: PayloadAction<CaseAuditActionPayload>
    ) => {
      const { auditId, userId, verifier, comment, rating, specialFindings, detailedFindings } = action.payload;
      
      // Initialize audit data if it doesn't exist
      if (!state.verifiedAudits[auditId]) {
        state.verifiedAudits[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Update audit with in-progress data
      state.verifiedAudits[auditId].verifier = verifier;
      state.verifiedAudits[auditId].comment = comment;
      state.verifiedAudits[auditId].rating = rating;
      state.verifiedAudits[auditId].specialFindings = specialFindings;
      state.verifiedAudits[auditId].detailedFindings = detailedFindings;
      
      // Set status to in-progress
      state.verifiedAudits[auditId].status = mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.IN_PROGRESS);
      
      // Mark when the form was last updated
      // We don't use verificationDate as that's only for completed verifications
      (state.verifiedAudits[auditId] as ExtendedStoredCaseAuditData).lastUpdated = createISODateString(new Date());
    },
    // Set current user
    setCurrentUser: (state, action: PayloadAction<string>) => {
      state.currentUserId = ensureUserId(action.payload);
      // User roles should be populated separately from API/MSW through setUserRoles action
    },
    // Action to populate user roles from API response
    setUserRoles: (state, action: PayloadAction<Record<string, { role: UserRole; department: string }>>) => {
      state.userRoles = action.payload;
    },
    // Action to update a single user's role
    setUserRole: (state, action: PayloadAction<{ userId: string; role: UserRole; department: string }>) => {
      const { userId, role, department } = action.payload;
      state.userRoles[userId] = { role, department };
    },
    // Action to reset quarterly audits (useful for clearing old data with empty userIds)
    resetQuarterlyAudits: (state, action: PayloadAction<{ quarterKey: QuarterPeriod }>) => {
      const { quarterKey } = action.payload;
      
      // Clear the quarterly selection for this quarter
      state.quarterlySelection[quarterKey] = {
        quarterKey,
        userQuarterlyAudits: [],
        previousQuarterRandomAudits: []
      };
      
      // Remove audit data for audits that belong to this quarter
      Object.keys(state.verifiedAudits).forEach(auditId => {
        const audit = state.verifiedAudits[auditId];
        if (audit.quarter === quarterKey) {
          delete state.verifiedAudits[auditId];
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchCurrentUser lifecycle
      .addCase(fetchCurrentUser.pending, () => {
        // Could add loading state here if needed
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        const user = action.payload;
        state.currentUserId = ensureUserId(user.id.toString());
        // Also set the user role
        state.userRoles[user.id.toString()] = {
          role: user.role,
          department: user.department || 'Unknown'
        };
      })
      .addCase(fetchCurrentUser.rejected, (_, action) => {
        console.error('Failed to fetch current user:', action.payload);
        // Could add error handling here if needed
      })
      
      // Handle saveAuditVerificationThunk lifecycle
      .addCase(saveAuditVerificationThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveAuditVerificationThunk.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Successfully saved verification data to backend:', action.payload);
      })
      .addCase(saveAuditVerificationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to save verification data';
        console.error('Failed to save verification data to backend:', action.payload);
      })
      
      // Handle verifyAuditThunk lifecycle
      .addCase(verifyAuditThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyAuditThunk.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Successfully verified audit on backend:', action.payload);
      })
      .addCase(verifyAuditThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to verify audit';
        console.error('Failed to verify audit on backend:', action.payload);
      })
      
      // Handle rejectAuditThunk lifecycle
      .addCase(rejectAuditThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectAuditThunk.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Successfully rejected audit on backend:', action.payload);
      })
      .addCase(rejectAuditThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reject audit';
        console.error('Failed to reject audit on backend:', action.payload);
      });
  }
});

export const { 
  initializeState, 
  verifyStep, 
  markStepIncorrect, 
  updateStepComment, 
  verifyAudit,
  rejectAudit,
  updateAuditStatus,
  selectQuarterlyAudits,
  updateUserRole,
  updateAuditInProgress,
  setCurrentUser,
  setUserRoles,
  setUserRole,
  resetQuarterlyAudits
} = caseAuditSlice.actions;

// Selectors
export const selectAuditData = (state: { caseAudit: CaseAuditState }) => 
  state.caseAudit.verifiedAudits;

export const selectUserQuarterlyStatus = (state: { caseAudit: CaseAuditState }) =>
  state.caseAudit.userQuarterlyStatus;

// Selector to get all user roles
export const selectAllUserRoles = (state: { caseAudit: CaseAuditState }) =>
  state.caseAudit.userRoles;

// Define the interface used by selectors - inherits from User type

// Ensure consistency with User interface
type UserForSelector = Pick<User, 'id' | 'name' | 'department' | 'role' | 'isActive'>;

// Memoized selector for users needing verification
export const selectUsersNeedingAudits = createSelector(
  [
    (_state, users: UserForSelector[]) => users
  ],
  (users) => {
    // Add transformation logic to modify the input in some way
    // Here we're adding isSelected: false to each user to make it a modified result
    return users.map(user => ({
      ...user,
      // Add a derived field to ensure we're not returning the exact input
      isAuditNeeded: true
    }));
  }
);

// Memoized selector for counting users that need verification
export const selectUsersNeedingAuditsCount = createSelector(
  [
    (state: { caseAudit: CaseAuditState }) => state.caseAudit.verifiedAudits,
    (_state, users: UserForSelector[]) => users
  ],
  (verifiedAudits, users) => {
    // Get current quarter and year
    const { quarter, year } = getCurrentQuarter();
    
    // Get all audits for current quarter
    const currentQuarterAudits = Object.values(verifiedAudits).filter(
      audit => audit.quarter === formatQuarterPeriod(quarter, year) && audit.year === year
    );
    
    // If there are no audits for the current quarter, all users need verification
    if (currentQuarterAudits.length === 0) {
      return users.length;
    }
    
    // Group audits by user
    const auditsByUser = currentQuarterAudits.reduce((acc, audit) => {
      if (!acc[audit.userId as string]) {
        acc[audit.userId as string] = [];
      }
      acc[audit.userId as string].push(audit);
      return acc;
    }, {} as Record<string, typeof currentQuarterAudits>);
    
    // Count users that either:
    // 1. Have no audits in the current quarter, OR
    // 2. Have no verified audits in the current quarter
    const usersNeeding = users.filter(user => {
      const userAudits = auditsByUser[user.id] || [];
      
      // If no audits for this quarter, they need verification
      if (userAudits.length === 0) {
        return true;
      }
      
      // Check if the user has any verified audits
      const hasVerifiedAudit = userAudits.some(audit => 
        audit.isVerified && audit.status === mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.VERIFIED)
      );
      
      // If they have no verified audits, they need verification
      return !hasVerifiedAudit;
    });
    
    return usersNeeding.length;
  }
);

// Apply verification data to an audit
export const applyCaseAuditData = (
  audit: CaseAudit, 
  verifiedAudits: CaseAuditState['verifiedAudits']
): CaseAudit => {
  // Find the verification data for this audit
  const auditData = verifiedAudits[audit.id];
  
  if (!auditData) return audit;
  
  // Ensure findings are the correct type
  const specialFindings = auditData.specialFindings || createEmptyFindings();
  const detailedFindings = auditData.detailedFindings || createEmptyFindings();
  
  // Create a deep copy of the audit with verification data applied
  return {
    ...audit,
    claimsStatus: audit.claimsStatus || CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: audit.coverageAmount || audit.totalAmount,
    isVerified: auditData.isVerified,
    comment: auditData.comment || audit.comment,
    rating: auditData.rating || audit.rating,
    specialFindings,
    detailedFindings,
    status: auditData.status || audit.status,
    notifiedCurrency: auditData.notifiedCurrency || audit.notifiedCurrency || 'CHF' // Include currency from stored data
  };
};

// New selector to get quarterly selected audits
export const selectQuarterlyAuditsForPeriod = createSelector(
  [
    (state: { caseAudit: CaseAuditState }) => state.caseAudit.quarterlySelection,
    (state: { caseAudit: CaseAuditState }) => state.caseAudit.verifiedAudits,
    (_state, quarterKey: string) => quarterKey
  ],
  (quarterlySelection, verifiedAudits, quarterKey) => {
    // Guard against invalid quarterKey
    if (!quarterKey || typeof quarterKey !== 'string' || !quarterKey.includes('-')) {
      return {
        userQuarterlyAudits: [],
        previousQuarterRandomAudits: [],
        lastSelectionDate: null
      };
    }

    // Parse quarter and year from quarterKey
    const [quarterStr, yearStr] = quarterKey.split('-');
    const quarterNum = parseInt(quarterStr.replace('Q', ''));
    const yearNum = parseInt(yearStr);
    
    // Validate parsed values
    if (isNaN(quarterNum) || isNaN(yearNum) || quarterNum < 1 || quarterNum > 4) {
      return {
        userQuarterlyAudits: [],
        previousQuarterRandomAudits: [],
        lastSelectionDate: null
      };
    }

    // If a selection exists for this quarter, use it
    if (quarterlySelection[quarterKey]) {
      // Get the audit IDs from the selection
      const selection = quarterlySelection[quarterKey];
      
      // Map the audit IDs to their full audit data
      const userQuarterlyAudits = selection.userQuarterlyAudits
        .map(id => ({ id, ...verifiedAudits[id] }))
        .filter(audit => !!audit); // Filter out any that don't exist
      
      const previousQuarterRandomAudits = selection.previousQuarterRandomAudits
        .map(id => ({ id, ...verifiedAudits[id] }))
        .filter(audit => !!audit); // Filter out any that don't exist
      
      return {
        userQuarterlyAudits,
        previousQuarterRandomAudits,
        lastSelectionDate: selection.lastSelectionDate
      };
    } 
    // If no selection exists, try to find audits based on quarter and year
    else {
      // Find all audits for this quarter and year
      const auditsForPeriod = Object.entries(verifiedAudits)
        .filter(([, audit]) => {
          if (!audit) return false;
          const auditQuarterStr = audit.quarter.split('-')[0].substring(1);
          const auditYearStr = audit.quarter.split('-')[1];
          const auditQuarter = parseInt(auditQuarterStr);
          const auditYear = parseInt(auditYearStr);
          return auditQuarter === quarterNum && auditYear === yearNum;
        })
        .map(([id, audit]) => ({ id, ...audit }));
      
      // Split into user quarterly and previous quarter random based on caseType
      const userQuarterlyAudits = auditsForPeriod
        .filter(audit => audit.caseType === CASE_TYPE_ENUM.USER_QUARTERLY);
      
      const previousQuarterRandomAudits = auditsForPeriod
        .filter(audit => audit.caseType === CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM);
      
      return {
        userQuarterlyAudits,
        previousQuarterRandomAudits,
        lastSelectionDate: null
      };
    }
  }
);

// Selector to get user role
export const selectUserRole = createSelector(
  [
    (state: { caseAudit: CaseAuditState }) => state.caseAudit.userRoles,
    (_state, userId: string) => userId
  ],
  (userRoles, userId) => {
    return userRoles[userId] || { role: USER_ROLE_ENUM.STAFF, department: '' };
  }
);

// Check if a user can verify a specific audit
export const canUserVerifyAudit = (
  state: { caseAudit: CaseAuditState },
  userId: string,
  auditId: string
): boolean => {
  try {
    const audit = state.caseAudit.verifiedAudits[auditId];
    const userRole = state.caseAudit.userRoles[userId];
    
    if (!audit || !userRole) return false;
    
    // Team leaders can't verify their own audits - must be verified by a specialist
    if (userRole.role === USER_ROLE_ENUM.TEAM_LEADER && audit.userId === userId) {
      return false;
    }
    
    // Make sure coverageAmount is defined before comparing
    const coverageAmount = audit.coverageAmount;
    if (typeof coverageAmount !== 'number') return false;
    
    // Check coverage limits based on role
    if (userRole.role === USER_ROLE_ENUM.STAFF && coverageAmount > 30000) {
      return false;
    }
    
    if (userRole.role === USER_ROLE_ENUM.SPECIALIST && coverageAmount > 150000) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in canUserVerifyAudit:', error);
    return false;
  }
};

// Helper function to get audits that meet coverage requirements for a user's role
export const getAuditsForUserRole = (
  audits: CaseAuditSummary[],
  userRole: UserRole
): CaseAuditSummary[] => {
  return audits.filter(audit => {
    // Check if audit is already reviewed by AKO Kredit
    if ('isAkoReviewed' in audit && audit.isAkoReviewed) return false;
    
    // Check if audit has appropriate claims status
    if ('claimsStatus' in audit && 
        audit.claimsStatus !== CLAIMS_STATUS_ENUM.FULL_COVER && 
        audit.claimsStatus !== CLAIMS_STATUS_ENUM.PARTIAL_COVER) {
      return false;
    }
    
    // Check coverage limits
    if (userRole === USER_ROLE_ENUM.STAFF && audit.coverageAmount > 30000) {
      return false;
    }
    
    if (userRole === USER_ROLE_ENUM.SPECIALIST && audit.coverageAmount > 150000) {
      return false;
    }
    
    return true;
  });
};

export default caseAuditSlice.reducer; 