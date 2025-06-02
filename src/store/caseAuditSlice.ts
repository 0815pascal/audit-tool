import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import {
  CaseAudit,
  CaseAuditActionPayload,
  FindingsRecord,
  Quarter,
  QuarterNumber,
  QuarterPeriod,
  RatingValue,
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
import { RootState } from './index';
import { CASE_TYPE_ENUM, CLAIMS_STATUS_ENUM, USER_ROLE_ENUM, AUDIT_STATUS_ENUM } from '../enums';
import { QUARTER_CALCULATIONS, API_BASE_PATH } from '../constants';
import { mapAuditStatusToCaseAuditStatus } from '../utils/statusUtils';

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

// Types for API responses
interface AuditCompletionResponse {
  success: boolean;
  auditId: string;
  status: string;
  completionDate?: string;
  message?: string;
}

interface QuarterlyAuditsResponse {
  success: boolean;
  data: {
    quarterKey: string;
    userQuarterlyAudits: Array<{
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
      comment?: string;
      rating?: string;
      specialFindings?: Record<string, boolean>;
      detailedFindings?: Record<string, boolean>;
    }>;
    previousQuarterRandomAudits: Array<{
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
      comment?: string;
      rating?: string;
      specialFindings?: Record<string, boolean>;
      detailedFindings?: Record<string, boolean>;
    }>;
    lastSelectionDate: string;
  };
}

interface CurrentUserResponse {
  success: boolean;
  data: User;
}

// RTK Query API slice for audit operations
export const auditApi = createApi({
  reducerPath: 'auditApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_PATH,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Audit', 'QuarterlyAudits', 'CurrentUser'],
  endpoints: (builder) => ({
    // Get current user
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/current-user',
      transformResponse: (response: CurrentUserResponse) => {
        if (!response.success) {
          throw new Error('Failed to fetch current user');
        }
        return response.data;
      },
      providesTags: [{ type: 'CurrentUser', id: 'current' }],
    }),

    // Get audits by quarter
    getAuditsByQuarter: builder.query<CaseAudit[], QuarterPeriod>({
      query: (quarter) => `/audits/quarter/${quarter}`,
      transformResponse: (response: CaseAudit[]) => response || [],
      providesTags: (result, _, quarter) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Audit' as const, id })),
              { type: 'Audit', id: `QUARTER-${quarter}` },
            ]
          : [{ type: 'Audit', id: `QUARTER-${quarter}` }],
    }),

    // Get audits by auditor
    getAuditsByAuditor: builder.query<CaseAudit[], string>({
      query: (auditorId) => `/audits/auditor/${auditorId}`,
      transformResponse: (response: CaseAudit[]) => response || [],
      providesTags: (result, _, auditorId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Audit' as const, id })),
              { type: 'Audit', id: `AUDITOR-${auditorId}` },
            ]
          : [{ type: 'Audit', id: `AUDITOR-${auditorId}` }],
    }),

    // Select quarterly audits
    selectQuarterlyAudits: builder.mutation<QuarterlyAuditsResponse['data'], QuarterPeriod>({
      query: (quarterPeriod) => ({
        url: '/audit-completion/select-quarterly',
        method: 'POST',
        body: { quarterKey: quarterPeriod, userIds: [] },
      }),
      transformResponse: (response: QuarterlyAuditsResponse) => {
        if (!response.success) {
          throw new Error('Failed to select quarterly audits');
        }
        return response.data;
      },
      invalidatesTags: (_, __, quarterPeriod) => [
        { type: 'QuarterlyAudits', id: quarterPeriod },
        { type: 'Audit', id: `QUARTER-${quarterPeriod}` },
      ],
    }),

    // Get quarterly audits for a specific period
    getQuarterlyAudits: builder.query<QuarterlyAuditsResponse['data'], QuarterPeriod>({
      query: (quarterPeriod) => `/audit-completion/select-quarterly/${quarterPeriod}`,
      transformResponse: (response: QuarterlyAuditsResponse) => {
        if (!response.success) {
          throw new Error('Failed to get quarterly audits');
        }
        return response.data;
      },
      providesTags: (_, __, quarterPeriod) => [
        { type: 'QuarterlyAudits', id: quarterPeriod },
      ],
    }),

    // Complete audit
    completeAudit: builder.mutation<AuditCompletionResponse, {
      auditId: string;
      auditor: string;
      rating: string;
      comment: string;
      specialFindings: Record<string, boolean>;
      detailedFindings: Record<string, boolean>;
      status: string;
      isCompleted: boolean;
    }>({
      query: ({ auditId, ...completionData }) => ({
        url: `/audit/${auditId}/complete`,
        method: 'POST',
        body: completionData,
      }),
      transformResponse: (response: AuditCompletionResponse) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to complete audit');
        }
        return response;
      },
      invalidatesTags: (_, __, { auditId }) => [
        { type: 'Audit', id: auditId },
        { type: 'Audit', id: 'LIST' },
      ],
    }),

    // Save audit completion (in-progress)
    saveAuditCompletion: builder.mutation<AuditCompletionResponse, {
      auditId: string;
      auditor: string;
      rating: string;
      comment: string;
      specialFindings: Record<string, boolean>;
      detailedFindings: Record<string, boolean>;
      status: string;
      isCompleted: boolean;
    }>({
      query: ({ auditId, ...completionData }) => ({
        url: `/audit-completion/${auditId}`,
        method: 'PUT',
        body: completionData,
      }),
      transformResponse: (response: AuditCompletionResponse) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to save audit completion');
        }
        return response;
      },
      invalidatesTags: (_, __, { auditId }) => [
        { type: 'Audit', id: auditId },
      ],
    }),

    // Create audit
    createAudit: builder.mutation<CaseAudit, Partial<CaseAudit>>({
      query: (auditData) => ({
        url: '/audits',
        method: 'POST',
        body: auditData,
      }),
      transformResponse: (response: CaseAudit) => response,
      invalidatesTags: [{ type: 'Audit', id: 'LIST' }],
    }),

    // Update audit
    updateAudit: builder.mutation<CaseAudit, CaseAudit>({
      query: ({ id, ...patch }) => ({
        url: `/audits/${id}`,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: (response: CaseAudit) => response,
      invalidatesTags: (_, __, { id }) => [
        { type: 'Audit', id },
        { type: 'Audit', id: 'LIST' },
      ],
    }),

    // Get audit findings
    getAuditFindings: builder.query<FindingsRecord[], string>({
      query: (auditId) => `/audits/${auditId}/findings`,
      transformResponse: (response: FindingsRecord[]) => response || [],
      providesTags: (_, __, auditId) => [
        { type: 'Audit', id: `${auditId}-findings` },
      ],
    }),

    // Add finding to audit
    addAuditFinding: builder.mutation<FindingsRecord, {
      auditId: string;
      type: string;
      description: string;
    }>({
      query: ({ auditId, ...findingData }) => ({
        url: `/audits/${auditId}/findings`,
        method: 'POST',
        body: findingData,
      }),
      invalidatesTags: (_, __, { auditId }) => [
        { type: 'Audit', id: `${auditId}-findings` },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetCurrentUserQuery,
  useGetAuditsByQuarterQuery,
  useGetAuditsByAuditorQuery,
  useSelectQuarterlyAuditsMutation,
  useGetQuarterlyAuditsQuery,
  useCompleteAuditMutation,
  useSaveAuditCompletionMutation,
  useCreateAuditMutation,
  useUpdateAuditMutation,
  useGetAuditFindingsQuery,
  useAddAuditFindingMutation,
} = auditApi;

// UI State interface for local state management
interface AuditUIState {
  currentUserId: string;
  selectedQuarter: QuarterPeriod | null;
  filteredYear: number;
  auditData: Record<string, StoredCaseAuditData>;
  userQuarterlyStatus: Record<string, Record<string, { completed: boolean; lastCompleted?: string }>>;
  userRoles: Record<string, { role: UserRole; department: string }>;
  loading: boolean;
  error: string | null;
}

// Create a default StoredCaseAuditData object with standard values
const createDefaultCaseAuditData = (userId: string): StoredCaseAuditData => {
  const { quarter, year } = getCurrentQuarter();

  return {
    isCompleted: false,
    isIncorrect: false,
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
    status: mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.PENDING),
    caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
    coverageAmount: 0,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    isAkoReviewed: false,
    dossierName: 'Default Dossier'
  };
};

// Initialize UI state
const initialUIState: AuditUIState = {
  currentUserId: '',
  selectedQuarter: null,
  filteredYear: new Date().getFullYear(),
  auditData: {},
  userQuarterlyStatus: {},
  userRoles: {},
  loading: false,
  error: null,
};

// UI slice for local state management
const auditUISlice = createSlice({
  name: 'auditUI',
  initialState: initialUIState,
  reducers: {
    // Set current user
    setCurrentUser: (state, action: PayloadAction<string>) => {
      state.currentUserId = ensureUserId(action.payload);
    },

    // Set selected quarter
    setSelectedQuarter: (state, action: PayloadAction<QuarterPeriod | null>) => {
      state.selectedQuarter = action.payload;
    },

    // Set filtered year
    setFilteredYear: (state, action: PayloadAction<number>) => {
      state.filteredYear = action.payload;
    },

    // Update audit status locally
    updateAuditStatus: (state, action: PayloadAction<{
      auditId: string;
      status: AUDIT_STATUS_ENUM;
      userId: string;
    }>) => {
      const { auditId, status, userId } = action.payload;
      
      if (!state.auditData[auditId]) {
        state.auditData[auditId] = createDefaultCaseAuditData(userId);
      }
      
      state.auditData[auditId].status = mapAuditStatusToCaseAuditStatus(status);
      state.auditData[auditId].isCompleted = status === AUDIT_STATUS_ENUM.COMPLETED;
    },

    // Update audit in progress
    updateAuditInProgress: (state, action: PayloadAction<CaseAuditActionPayload>) => {
      const { auditId, userId, auditor, comment, rating, specialFindings, detailedFindings } = action.payload;
      
      if (!state.auditData[auditId]) {
        state.auditData[auditId] = createDefaultCaseAuditData(userId);
      }
      
      state.auditData[auditId].auditor = auditor;
      state.auditData[auditId].comment = comment;
      state.auditData[auditId].rating = rating;
      state.auditData[auditId].specialFindings = specialFindings || createEmptyFindings();
      state.auditData[auditId].detailedFindings = detailedFindings || createEmptyFindings();
      state.auditData[auditId].status = mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.IN_PROGRESS);
    },

    // Complete audit locally
    completeAudit: (state, action: PayloadAction<CaseAuditActionPayload>) => {
      const { auditId, auditor, comment, rating, specialFindings, detailedFindings } = action.payload;
      const auditData = state.auditData[auditId];
      
      if (auditData) {
        auditData.isCompleted = true;
        auditData.status = mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.COMPLETED);
        auditData.auditor = ensureUserId(auditor.toString());
        auditData.comment = comment || '';
        auditData.rating = rating || '';
        auditData.specialFindings = specialFindings || createEmptyFindings();
        auditData.detailedFindings = detailedFindings || createEmptyFindings();
        auditData.completionDate = createISODateString(new Date());
        
        const quarterKey = auditData.quarter;
        const userId = auditData.userId.toString();
        
        if (!state.userQuarterlyStatus[userId]) {
          state.userQuarterlyStatus[userId] = {};
        }
        
        if (!state.userQuarterlyStatus[userId][quarterKey]) {
          state.userQuarterlyStatus[userId][quarterKey] = { completed: false };
        }
        
        state.userQuarterlyStatus[userId][quarterKey].completed = true;
        state.userQuarterlyStatus[userId][quarterKey].lastCompleted = createISODateString(new Date());
      }
    },

    // Set user role
    setUserRole: (state, action: PayloadAction<{
      userId: string;
      role: UserRole;
      department: string;
    }>) => {
      const { userId, role, department } = action.payload;
      state.userRoles[userId] = { role, department };
    },

    // Store quarterly audits
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
        comment?: string;
        rating?: string;
        specialFindings?: FindingsRecord;
        detailedFindings?: FindingsRecord;
      }>;
    }>) => {
      const { audits } = action.payload;
      
      // Clear existing audits for the same quarter selection
      // We need to identify which audits belong to the current auto-selection
      // and remove them before adding the new ones
      if (audits.length > 0) {
        // Get the quarters from the new audits to identify which ones to clear
        const quartersInNewSelection = new Set(audits.map(audit => audit.quarter));
        
        // Remove existing audits that have the same quarters as the new selection
        // This prevents accumulation when Auto-Select is clicked multiple times
        Object.keys(state.auditData).forEach(auditId => {
          const existingAudit = state.auditData[auditId];
          if (existingAudit && quartersInNewSelection.has(existingAudit.quarter)) {
            // Only remove if it's a quarterly selection audit (not manually added audits)
            if (existingAudit.caseType === CASE_TYPE_ENUM.USER_QUARTERLY || 
                existingAudit.caseType === CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM) {
              delete state.auditData[auditId];
            }
          }
        });
      }
      
      // Now add the new audits
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
          comment: audit.comment || '',
          rating: (audit.rating || '') as RatingValue,
          specialFindings: audit.specialFindings || createEmptyFindings(),
          detailedFindings: audit.detailedFindings || createEmptyFindings(),
          status: mapAuditStatusToCaseAuditStatus(audit.status as AUDIT_STATUS_ENUM),
          caseType: audit.caseType as CASE_TYPE_ENUM,
          coverageAmount: audit.coverageAmount,
          claimsStatus: audit.claimsStatus as CLAIMS_STATUS_ENUM,
          isAkoReviewed: audit.isAkoReviewed,
          dossierName: `Case ${audit.id}`,
          notifiedCurrency: audit.notifiedCurrency || 'CHF'
        };
      });
    },

    // Store all cases for a quarter (when quarter dropdown changes)
    storeAllCasesForQuarter: (state, action: PayloadAction<{
      quarter: string;
      cases: Array<{
        id: string;
        userId: string;
        coverageAmount: number;
        claimsStatus: string;
        quarter: string;
        notifiedCurrency?: string;
      }>;
    }>) => {
      const { cases } = action.payload;
      
      // Clear ALL existing audit cases (auto-selected and quarter display)
      // This ensures when user selects a quarter from dropdown, 
      // any previously auto-selected cases are completely replaced
      Object.keys(state.auditData).forEach(auditId => {
        const existingAudit = state.auditData[auditId];
        if (existingAudit && (
          existingAudit.caseType === CASE_TYPE_ENUM.QUARTER_DISPLAY ||
          existingAudit.caseType === CASE_TYPE_ENUM.USER_QUARTERLY ||
          existingAudit.caseType === CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM
        )) {
          delete state.auditData[auditId];
        }
      });
      
      // Add the new cases as display-only audits
      cases.forEach(caseData => {
        state.auditData[caseData.id] = {
          isCompleted: false,
          isIncorrect: false,
          completionDate: null,
          userId: ensureUserId(caseData.userId),
          quarter: caseData.quarter,
          year: parseInt(caseData.quarter.split('-')[1]),
          steps: {},
          auditor: ensureUserId(''),
          comment: '',
          rating: '' as RatingValue,
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          status: mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.PENDING),
          caseType: CASE_TYPE_ENUM.QUARTER_DISPLAY, // New case type for quarter display
          coverageAmount: caseData.coverageAmount,
          claimsStatus: caseData.claimsStatus as CLAIMS_STATUS_ENUM,
          isAkoReviewed: false,
          dossierName: `Case ${caseData.id}`,
          notifiedCurrency: caseData.notifiedCurrency || 'CHF'
        };
      });
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export UI actions
export const {
  setCurrentUser,
  setSelectedQuarter,
  setFilteredYear,
  updateAuditStatus,
  updateAuditInProgress,
  completeAudit,
  setUserRole,
  storeQuarterlyAudits,
  storeAllCasesForQuarter,
  setLoading,
  setError,
  clearError,
} = auditUISlice.actions;

// Enhanced selectors that work with RTK Query cache
const getCurrentUserQuerySelector = auditApi.endpoints.getCurrentUser.select();

export const selectCurrentUser = createSelector(
  [getCurrentUserQuerySelector],
  (currentUserResult) => currentUserResult.data || null
);

export const selectCurrentUserId = (state: RootState) => state.auditUI.currentUserId;
export const selectSelectedQuarter = (state: RootState) => state.auditUI.selectedQuarter;
export const selectFilteredYear = (state: RootState) => state.auditUI.filteredYear;
export const selectAuditData = (state: RootState) => state.auditUI.auditData;
export const selectUserQuarterlyStatus = (state: RootState) => state.auditUI.userQuarterlyStatus;
export const selectUserRoles = (state: RootState) => state.auditUI.userRoles;
export const selectAuditUILoading = (state: RootState) => state.auditUI.loading;
export const selectAuditUIError = (state: RootState) => state.auditUI.error;

// Selector to get user role
export const selectUserRole = createSelector(
  [selectUserRoles, (_state: RootState, userId: string) => userId],
  (userRoles, userId) => {
    return userRoles[userId] || { role: USER_ROLE_ENUM.STAFF, department: '' };
  }
);

// Check if a user can complete a specific audit
export const canUserCompleteAudit = (
  state: RootState,
  auditId: string
): boolean => {
  try {
    const currentUserId = state.auditUI.currentUserId.toString();
    const currentUserRole = state.auditUI.userRoles[currentUserId]?.role;
    const auditData = state.auditUI.auditData[auditId];
    
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

// Quarterly audits selector
export const selectQuarterlyAuditsForPeriod = createSelector(
  [selectAuditData, (_state: RootState, quarterKey: string) => quarterKey],
  (auditData, quarterKey) => {
    if (!quarterKey?.includes('-')) {
      return {
        userQuarterlyAudits: [],
        previousQuarterRandomAudits: [],
        quarterDisplayCases: [],
        lastSelectionDate: null
      };
    }

    // Get all audits stored for this quarter selection
    const auditsForPeriod = Object.entries(auditData)
      .map(([id, audit]) => ({ id, ...audit }))
      .filter(audit => audit); // Only keep valid audits
    
    // Separate by case type
    const userQuarterlyAudits = auditsForPeriod
      .filter(audit => audit.caseType === CASE_TYPE_ENUM.USER_QUARTERLY);
    
    const previousQuarterRandomAudits = auditsForPeriod
      .filter(audit => audit.caseType === CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM);
    
    // Include cases that are just for display (these should be for any quarter since we clear all when switching)
    const quarterDisplayCases = auditsForPeriod
      .filter(audit => audit.caseType === CASE_TYPE_ENUM.QUARTER_DISPLAY);
    
    return {
      userQuarterlyAudits,
      previousQuarterRandomAudits,
      quarterDisplayCases,
      lastSelectionDate: null
    };
  }
);

// Export the UI reducer as default
export default auditUISlice.reducer;