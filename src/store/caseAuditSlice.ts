import {createAsyncThunk, createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  ApiResponse,
  CaseAuditActionPayload,
  CaseAuditState,
  CaseAuditStep,
  Quarter,
  QuarterNumber,
  QuarterPeriod,
  RatingValue,
  StatusUpdatePayload,
  StoredCaseAuditData,
  User,
  UserRole
} from '../types/types';
import {
  createUserId,
  createValidYear,
  ensureUserId,
  formatQuarterPeriod,
  createEmptyFindings,
  createISODateString,
} from '../types/typeHelpers';
import {CASE_TYPE_ENUM, CLAIMS_STATUS_ENUM, USER_ROLE_ENUM, AUDIT_STATUS_ENUM} from '../enums';
import {QUARTER_CALCULATIONS, API_BASE_PATH} from '../constants';
import {mapAuditStatusToCaseAuditStatus} from '../utils/statusUtils';
import {
  completeAuditAPI,
  CompletionResponse
} from '../services/auditService';

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
  
  return cachedQuarter;
};

// Format quarter and year (e.g., "Q2-2023")
export const formatQuarterYear = (quarter: QuarterNumber, year: number): QuarterPeriod => {
  return `Q${quarter}-${year}`;
};

// Using utility function for status mapping from utils/statusUtils.ts

// Extended version of StoredCaseAuditData with additional fields
interface ExtendedStoredCaseAuditData extends StoredCaseAuditData {
  lastUpdated?: string;
}

// Initialize a proper version of CaseAuditState
const initialState: CaseAuditState = {
  auditData: {},
  userQuarterlyStatus: {},
  userRoles: {}, // Remove mock data - this should be populated from API
  currentUserId: createUserId(''), // No default user - should be fetched from API
};

// Create a default StoredCaseAuditData object with standard values
const createDefaultCaseAuditData = (userId: string): StoredCaseAuditData => {
  const { quarter, year } = getCurrentQuarter();

  return {
    isCompleted: false,
    isIncorrect: false, // Required by StoredCaseAuditData
    completionDate: null,
    userId: createUserId(userId),
    quarter: formatQuarterPeriod(quarter, year),
    year,
    steps: {},
    auditor: createUserId(''),
    comment: '',
    rating: '' as RatingValue,
    specialFindings: createEmptyFindings(),
    detailedFindings: createEmptyFindings(),
    status: mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.COMPLETED),
    caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
    coverageAmount: 0,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    isAkoReviewed: false,
    dossierName: 'Default Dossier'
  };
};

// Create step object with proper id
const createStepWithId = (stepId: string, isCompleted: boolean = false, isIncorrect: boolean = false, comment: string = ''): CaseAuditStep => {
  return {
    id: stepId,
    isCompleted,
    isIncorrect,
    comment
  };
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
      const response = await fetch(`${API_BASE_PATH}/auth/current-user`);
      const data = await response.json() as ApiResponse<User>;
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch current user');
      }
      
      return (data).data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch current user');
    }
  }
);

// Async thunk for saving audit completion data (in-progress)
export const saveAuditCompletionThunk = createAsyncThunk<
  CompletionResponse,
  CaseAuditActionPayload,
  { rejectValue: string }
>(
  'caseAudit/saveAuditCompletion',
  async (payload, { rejectWithValue }) => {
    try {
      console.log('[Redux] Saving audit completion:', payload);
      
      return await completeAuditAPI(
        payload.auditId,
        payload.auditor,
        payload
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[Redux] Error saving audit completion:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for completing audit
export const completeAuditThunk = createAsyncThunk<
  CompletionResponse,
  CaseAuditActionPayload,
  { rejectValue: string }
>(
  'caseAudit/completeAudit',
  async (payload, { rejectWithValue }) => {
    try {
      console.log('[Redux] Completing audit:', payload);
      
      return await completeAuditAPI(
        payload.auditId,
        payload.auditor,
        payload
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[Redux] Error completing audit:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const caseAuditSlice = createSlice({
  name: 'caseAudit',
  initialState,
  reducers: {
    // Initialize the state with sample data if needed
    initializeState: (state) => {
      // Create some sample data for past quarters if none exists
      if (Object.keys(state.auditData).length === 0) {
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
        
        // Add a sample past dossier completion for U001
        state.auditData['INV001-PAST'] = {
          isCompleted: true,
          isIncorrect: false,
          completionDate: createISODateString(new Date(pastYear, (pastQuarter - 1) * 3 + 2, 15)),
          userId: createUserId('1'),
          quarter: formatQuarterPeriod(pastQuarter, pastYear),
          year: pastYear,
          steps: {
            'S1': createStepWithId('S1', true, false, ''),
            'S2': createStepWithId('S2', true, false, '')
          },
          auditor: createUserId(''),
          comment: '',
          rating: '',
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          status: mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.COMPLETED),
          caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
          coverageAmount: 0,
          claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
          dossierName: 'Sample Past Dossier 1'
        };
        
        // Add sample for a second past quarter (two quarters ago)
        let pastQuarter2Value = pastQuarterValue - 1;
        let pastYear2 = pastYear;
        
        if (pastQuarter2Value < 1) {
          pastQuarter2Value = 4;
          pastYear2 = createValidYear(pastYear.valueOf() - 1);
        }
        
        // Cast to QuarterNumber type
        const pastQuarter2 = pastQuarter2Value as QuarterNumber;

        state.auditData['INV002-PAST'] = {
          isCompleted: true,
          isIncorrect: false,
          completionDate: createISODateString(new Date(pastYear2.valueOf(), (pastQuarter2 - 1) * 3 + 2, 10)),
          userId: createUserId('2'),
          quarter: formatQuarterPeriod(pastQuarter2, pastYear2),
          year: pastYear2,
          steps: {
            'S1': createStepWithId('S1', true, false, ''),
            'S2': createStepWithId('S2', true, false, '')
          },
          auditor: createUserId(''),
          comment: '',
          rating: '',
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          status: mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.COMPLETED),
          caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
          coverageAmount: 0,
          claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
          dossierName: 'Sample Past Dossier 2'
        };
        
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
          completed: true,
          lastCompleted: createISODateString(new Date(pastYear.valueOf(), (pastQuarter - 1) * 3 + 2, 15))
        };
        
        state.userQuarterlyStatus['2'][quarterKey2] = {
          completed: true,
          lastCompleted: createISODateString(new Date(pastYear2.valueOf(), (pastQuarter2 - 1) * 3 + 2, 10))
        };
      }
    },
    completeAudit: (
      state,
      action: PayloadAction<CaseAuditActionPayload>
    ) => {
      const { auditId, auditor, comment, rating, specialFindings, detailedFindings } = action.payload;
      const auditData = state.auditData[auditId];
      
      if (auditData) {
        // Set as completed
        auditData.isCompleted = true;
        auditData.status = mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.COMPLETED);
        auditData.auditor = ensureUserId(auditor.toString());
        auditData.comment = comment || '';
        auditData.rating = rating || '';
        auditData.specialFindings = specialFindings || createEmptyFindings();
        auditData.detailedFindings = detailedFindings || createEmptyFindings();
        auditData.lastUpdated = createISODateString(new Date());
        
        // Update user quarterly status
        const quarterKey = auditData.quarter;
        const userId = auditData.userId.toString();
        
        if (!state.userQuarterlyStatus[userId]) {
          state.userQuarterlyStatus[userId] = {};
        }
        
        if (!state.userQuarterlyStatus[userId][quarterKey]) {
          state.userQuarterlyStatus[userId][quarterKey] = {
            completed: false
          };
        }
        
        // Update completion date and auditor when completed
        if (auditData.isCompleted) {
          auditData.completionDate = createISODateString(new Date());
          state.userQuarterlyStatus[userId][quarterKey].completed = true;
          state.userQuarterlyStatus[userId][quarterKey].lastCompleted = createISODateString(new Date());
        }
      }
    },
    updateAuditStatus: (
      state,
      action: PayloadAction<StatusUpdatePayload>
    ) => {
      const { auditId, status, userId } = action.payload;
      
      // Initialize audit data if it doesn't exist
      if (!state.auditData[auditId]) {
        state.auditData[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Update audit status - directly set status since both enums have the same string values
      state.auditData[auditId].status = status;
      
      // Update isCompleted based on the status value
      state.auditData[auditId].isCompleted = status === AUDIT_STATUS_ENUM.COMPLETED;
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
    // Add new action to handle in-progress completion state
    updateAuditInProgress: (
      state,
      action: PayloadAction<CaseAuditActionPayload>
    ) => {
      const { auditId, userId, auditor, comment, rating, specialFindings, detailedFindings } = action.payload;
      
      // Initialize audit data if it doesn't exist
      if (!state.auditData[auditId]) {
        state.auditData[auditId] = createDefaultCaseAuditData(userId);
      }
      
      // Update audit with in-progress data
      state.auditData[auditId].auditor = auditor;
      state.auditData[auditId].comment = comment;
      state.auditData[auditId].rating = rating;
      state.auditData[auditId].specialFindings = specialFindings;
      state.auditData[auditId].detailedFindings = detailedFindings;
      
      // Set status to in-progress
      state.auditData[auditId].status = mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.IN_PROGRESS);
      
      // Mark when the form was last updated
      // We don't use completionDate as that's only for completed audits
      (state.auditData[auditId] as ExtendedStoredCaseAuditData).lastUpdated = createISODateString(new Date());
    },
    // Set current user
    setCurrentUser: (state, action: PayloadAction<string>) => {
      state.currentUserId = ensureUserId(action.payload);
      // User roles should be populated separately from API/MSW through setUserRoles action
    },
// Action to populate user roles from API response
// Action to update a single user's role
    setUserRole: (state, action: PayloadAction<{ userId: string; role: UserRole; department: string }>) => {
      const { userId, role, department } = action.payload;
      state.userRoles[userId] = { role, department };
    },
    
    // Action to store selected quarterly audits
    storeQuarterlyAudits: (state, action: PayloadAction<{
      audits: Array<{
        id: string;
        userId: string;
        status: string;
        auditor: string;
        coverageAmount: number;
        isCompleted: boolean;
        claimsStatus: string;
        quarter: string;
        isAkoReviewed: boolean;
        notifiedCurrency?: string;
        caseType: string;
      }>;
    }>) => {
      const { audits } = action.payload;
      
      // Store each audit in the auditData dictionary
      audits.forEach(audit => {
        state.auditData[audit.id] = {
          isCompleted: audit.isCompleted,
          isIncorrect: false,
          completionDate: null,
          userId: ensureUserId(audit.userId),
          quarter: audit.quarter,
          year: parseInt(audit.quarter.split('-')[1]),
          steps: {},
          auditor: ensureUserId(audit.auditor),
          comment: '',
          rating: '' as RatingValue,
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          status: mapAuditStatusToCaseAuditStatus(audit.status as AUDIT_STATUS_ENUM),
          caseType: audit.caseType as CASE_TYPE_ENUM,
          coverageAmount: audit.coverageAmount,
          claimsStatus: audit.claimsStatus as CLAIMS_STATUS_ENUM,
          isAkoReviewed: audit.isAkoReviewed,
          dossierName: `Case ${audit.id}`,
          notifiedCurrency: audit.notifiedCurrency || 'CHF'
        };
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
          role: user.authorities,
          department: user.department || 'Unknown'
        };
      })
      .addCase(fetchCurrentUser.rejected, (_, action) => {
        console.error('Failed to fetch current user:', action.payload);
        // Could add error handling here if needed
      })
      
      // Handle saveAuditCompletionThunk lifecycle
      .addCase(saveAuditCompletionThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveAuditCompletionThunk.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Successfully saved audit data to backend:', action.payload);
      })
      .addCase(saveAuditCompletionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to save audit data';
        console.error('Failed to save audit data to backend:', action.payload);
      })
      
      // Handle completeAuditThunk lifecycle
      .addCase(completeAuditThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeAuditThunk.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Successfully completed audit on backend:', action.payload);
      })
      .addCase(completeAuditThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to complete audit';
        console.error('Failed to complete audit on backend:', action.payload);
      });
  }
});

export const { 
  initializeState,
  completeAudit,
  updateAuditStatus,
  updateAuditInProgress,
  setCurrentUser,
  setUserRole,
  storeQuarterlyAudits
} = caseAuditSlice.actions;

// Selectors
export const selectAuditData = (state: { caseAudit: CaseAuditState }) => 
  state.caseAudit.auditData;

export const selectUserQuarterlyStatus = (state: { caseAudit: CaseAuditState }) =>
  state.caseAudit.userQuarterlyStatus;

// Selector to get all user roles
// Define the interface used by selectors - inherits from User type

// Ensure consistency with User interface
type UserForSelector = Pick<User, 'id' | 'displayName' | 'department' | 'authorities' | 'enabled'>;

// Memoized selector for users needing audits
export const selectUsersNeedingAudits = createSelector(
  [
    (_state, users: UserForSelector[]) => users
  ],
  (users) => {
    // Add transformation logic to modify the input in some way
    // Here we're adding isAuditNeeded: false to each user to make it a modified result
    return users.map(user => ({
      ...user,
      // Add a derived field to ensure we're not returning the exact input
      isAuditNeeded: true
    }));
  }
);

// Memoized selector for counting users that need audits
createSelector(
    [
      (state: { caseAudit: CaseAuditState }) => state.caseAudit.auditData,
      (_state, users: UserForSelector[]) => users
    ],
    (auditData, users) => {
      // Get current quarter and year
      const { quarter, year } = getCurrentQuarter();

      // Get all audits for current quarter
      const currentQuarterAudits = Object.values(auditData).filter(
          audit => audit.quarter === formatQuarterPeriod(quarter, year) && audit.year === year
      );

      // If there are no audits for the current quarter, all users need audits
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
      // 2. Have no completed audits in the current quarter
      const usersNeeding = users.filter(user => {
        const userAudits = auditsByUser[user.id] || [];

        // If no audits for this quarter, they need audits
        if (userAudits.length === 0) {
          return true;
        }

        // Check if the user has any completed audits
        const hasCompletedAudit = userAudits.some(audit =>
            audit.isCompleted && audit.status === mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.COMPLETED)
        );

        // If they have no completed audits, they need audits
        return !hasCompletedAudit;
      });

      return usersNeeding.length;
    }
);
// Apply completion data to an audit
// New selector to get quarterly selected audits
export const selectQuarterlyAuditsForPeriod = createSelector(
  [
    (state: { caseAudit: CaseAuditState }) => state.caseAudit.auditData,
    (_state, quarterKey: string) => quarterKey
  ],
  (auditData, quarterKey) => {
    // Guard against invalid quarterKey
    if (!quarterKey?.includes('-')) {
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

    // Find all audits for this quarter and year
    const auditsForPeriod = Object.entries(auditData)
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

// Check if a user can complete a specific audit
export const canUserCompleteAudit = (
  state: { caseAudit: CaseAuditState },
  auditId: string
): boolean => {
  try {
    const currentUserId = state.caseAudit.currentUserId.toString();
    const currentUserRole = state.caseAudit.userRoles[currentUserId]?.role;
    const auditData = state.caseAudit.auditData[auditId];
    
    if (!auditData || !currentUserRole) {
      return false;
    }
    
    // Team leaders can't complete their own audits - must be completed by a specialist
    if (currentUserRole === USER_ROLE_ENUM.TEAM_LEADER && auditData.userId === currentUserId) {
      return false;
    }
    
    // Only team leaders and specialists can complete audits
    return currentUserRole === USER_ROLE_ENUM.TEAM_LEADER || currentUserRole === USER_ROLE_ENUM.SPECIALIST;
  } catch (error) {
    console.error('Error in canUserCompleteAudit:', error);
    return false;
  }
};

// Helper function to get audits that meet coverage requirements for a user's role
export default caseAuditSlice.reducer;