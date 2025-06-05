import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import { CURRENCY } from '../types/currencyTypes';
import {
  CaseAudit,
  CaseAuditStatus,
  CaseAuditActionPayload,
  FindingsRecord,
  StoredCaseAuditData,
  Quarter,
  QuarterNumber,
  QuarterPeriod,
  RatingValue,
  User,
  StoreQuarterlyAuditsPayload,
  StoreAllCasesForQuarterPayload,
  LoadPreLoadedCasesPayload,
  QuarterlyAuditsData,
  QuarterlyAuditsResponse,
  AuditCompletionResponse,
  CurrentUserResponse,
  AuditCompletionParams,
  AuditUIState,
  UpdateAuditStatusPayload,
  SetUserRolePayload,
  PreLoadedCase,
  PreLoadedCasesResponse,
  AddAuditFindingParams,
  QuarterlyAuditsSelector
} from '../types/types';
import { CASE_TYPE_ENUM, CLAIMS_STATUS_ENUM, USER_ROLE_ENUM, AUDIT_STATUS_ENUM, HTTP_METHOD } from '../enums';
import { QUARTER_CALCULATIONS } from '../constants';

import {
  createUserId,
  createValidYear,
  ensureUserId,
  formatQuarterPeriod,
  createEmptyFindings,
  createISODateString,
  convertToFindingsRecord
} from '../types/typeHelpers';
import api from './api';

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

// Inject audit endpoints into the main API slice
export const auditApi = api.injectEndpoints({
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
    getAuditsByQuarter: builder.query<CaseAudit[], string>({
      query: (quarter) => `/audits/quarter/${quarter}`,
      transformResponse: (response: CaseAudit[]) => response ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Audit' as const, id })),
              { type: 'Audit', id: 'LIST' },
            ]
          : [{ type: 'Audit', id: 'LIST' }],
    }),

    // Get audits by auditor
    getAuditsByAuditor: builder.query<CaseAudit[], string>({
      query: (auditorId) => `/audits/auditor/${auditorId}`,
      transformResponse: (response: CaseAudit[]) => response ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Audit' as const, id })),
              { type: 'Audit', id: 'LIST' },
            ]
          : [{ type: 'Audit', id: 'LIST' }],
    }),

    // Select quarterly audits
    selectQuarterlyAudits: builder.mutation<QuarterlyAuditsData, QuarterPeriod>({
      query: (quarterPeriod) => ({
        url: '/audit-completion/select-quarterly',
        method: HTTP_METHOD.POST,
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
    getQuarterlyAudits: builder.query<QuarterlyAuditsData, QuarterPeriod>({
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
    completeAudit: builder.mutation<AuditCompletionResponse, AuditCompletionParams>({
      query: ({ auditId, ...completionData }) => ({
        url: `/audit/${auditId}/complete`,
        method: HTTP_METHOD.POST,
        body: completionData,
      }),
      transformResponse: (response: AuditCompletionResponse) => {
        if (!response.success) {
          throw new Error(response.message ?? 'Failed to complete audit');
        }
        return response;
      },
      invalidatesTags: (_, __, { auditId }) => [
        { type: 'Audit', id: auditId },
        { type: 'Audit', id: 'LIST' },
      ],
    }),

    // Save audit completion (in-progress)
    saveAuditCompletion: builder.mutation<AuditCompletionResponse, AuditCompletionParams>({
      query: ({ auditId, ...completionData }) => ({
        url: `/audit-completion/${auditId}`,
        method: HTTP_METHOD.PUT,
        body: completionData,
      }),
      transformResponse: (response: AuditCompletionResponse) => {
        if (!response.success) {
          throw new Error(response.message ?? 'Failed to save audit completion');
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
        method: HTTP_METHOD.POST,
        body: auditData,
      }),
      transformResponse: (response: CaseAudit) => response,
      invalidatesTags: [{ type: 'Audit', id: 'LIST' }],
    }),

    // Update audit
    updateAudit: builder.mutation<CaseAudit, CaseAudit>({
      query: ({ id, ...patch }) => ({
        url: `/audits/${id}`,
        method: HTTP_METHOD.PUT,
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
      transformResponse: (response: FindingsRecord[]) => response ?? [],
      providesTags: (_, __, auditId) => [
        { type: 'Audit', id: `${auditId}-findings` },
      ],
    }),

    // Add finding to audit
    addAuditFinding: builder.mutation<FindingsRecord, AddAuditFindingParams>({
      query: ({ auditId, findingType, findingDescription }) => ({
        url: `/audit-findings/${auditId}`,
        method: HTTP_METHOD.POST,
        body: { findingType, findingDescription },
      }),
    }),

    // Get pre-loaded cases (verified and in-progress)
    getPreLoadedCases: builder.query<PreLoadedCase[], void>({
      query: () => '/pre-loaded-cases',
      transformResponse: (response: PreLoadedCasesResponse) => response.data ?? [],
    }),
  }),
  overrideExisting: false,
});

// Export hooks for use in components
export const {
  useGetCurrentUserQuery,
  useCompleteAuditMutation,
  useSaveAuditCompletionMutation,
  useGetPreLoadedCasesQuery,
} = auditApi;

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
              status: AUDIT_STATUS_ENUM.PENDING,
    caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
    coverageAmount: 0,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    dossierName: 'Default Dossier',
    notifiedCurrency: CURRENCY.CHF
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
    updateAuditStatus: (state, action: PayloadAction<UpdateAuditStatusPayload>) => {
      const { auditId, status, userId } = action.payload;
      
      if (!state.auditData[auditId]) {
        state.auditData[auditId] = createDefaultCaseAuditData(userId);
      }
      
      state.auditData[auditId].status = status;
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
      state.auditData[auditId].specialFindings = specialFindings ?? createEmptyFindings();
      state.auditData[auditId].detailedFindings = detailedFindings ?? createEmptyFindings();
      state.auditData[auditId].status = AUDIT_STATUS_ENUM.IN_PROGRESS;
    },

    // Complete audit locally
    completeAudit: (state, action: PayloadAction<CaseAuditActionPayload>) => {
      const { auditId, auditor, comment, rating, specialFindings, detailedFindings } = action.payload;
      const auditData = state.auditData[auditId];
      
      if (auditData) {
        auditData.isCompleted = true;
        auditData.status = AUDIT_STATUS_ENUM.COMPLETED;
        auditData.auditor = ensureUserId(auditor.toString());
        auditData.comment = comment ?? '';
        auditData.rating = rating ?? '';
        auditData.specialFindings = specialFindings ?? createEmptyFindings();
        auditData.detailedFindings = detailedFindings ?? createEmptyFindings();
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
    setUserRole: (state, action: PayloadAction<SetUserRolePayload>) => {
      const { userId, role, department } = action.payload;
      state.userRoles[userId] = { role, department };
    },

    // Store quarterly audits
    storeQuarterlyAudits: (state, action: PayloadAction<StoreQuarterlyAuditsPayload>) => {
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
            // Only remove if it's a quarterly selection audit (not manually added audits or PRE_LOADED)
            if (existingAudit.caseType === CASE_TYPE_ENUM.USER_QUARTERLY || 
                existingAudit.caseType === CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM) {
              // NOTE: PRE_LOADED cases are preserved during auto-selection
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
          comment: audit.comment ?? '',
          rating: (audit.rating ?? '') as RatingValue,
          specialFindings: convertToFindingsRecord(audit.specialFindings),
          detailedFindings: convertToFindingsRecord(audit.detailedFindings),
          status: audit.status as AUDIT_STATUS_ENUM,
          caseType: audit.caseType as CASE_TYPE_ENUM,
          coverageAmount: audit.coverageAmount,
          claimsStatus: audit.claimsStatus as CLAIMS_STATUS_ENUM,
          dossierName: 'Generated Audit',
          notifiedCurrency: audit.notifiedCurrency ?? CURRENCY.CHF
        };
      });
    },

    // Store all cases for a quarter (when quarter dropdown changes)
    storeAllCasesForQuarter: (state, action: PayloadAction<StoreAllCasesForQuarterPayload>) => {
      const { cases } = action.payload;
      
      // Clear ALL existing audit cases (including pre-loaded cases)
      // When user selects a quarter from dropdown, show only cases from that quarter
      Object.keys(state.auditData).forEach(auditId => {
        const existingAudit = state.auditData[auditId];
        if (existingAudit && (
          existingAudit.caseType === CASE_TYPE_ENUM.QUARTER_DISPLAY ||
          existingAudit.caseType === CASE_TYPE_ENUM.USER_QUARTERLY ||
          existingAudit.caseType === CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM ||
          existingAudit.caseType === CASE_TYPE_ENUM.PRE_LOADED // Clear pre-loaded cases too
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
          status: AUDIT_STATUS_ENUM.PENDING,
          caseType: CASE_TYPE_ENUM.QUARTER_DISPLAY, // New case type for quarter display
          coverageAmount: caseData.coverageAmount,
          claimsStatus: caseData.claimsStatus as CLAIMS_STATUS_ENUM,
          dossierName: `Case ${caseData.id}`,
          notifiedCurrency: caseData.notifiedCurrency ?? CURRENCY.CHF
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

    // Load pre-loaded cases (verified and in-progress) on app initialization
    loadPreLoadedCases: (state, action: PayloadAction<LoadPreLoadedCasesPayload>) => {
      const preLoadedCases = action.payload;
      
      // Add pre-loaded cases without clearing existing data
      preLoadedCases.forEach(caseData => {
        // Determine the correct status based on completion and auditor assignment
        let status: CaseAuditStatus;
        if (caseData.isCompleted) {
          status = AUDIT_STATUS_ENUM.COMPLETED;
        } else if (caseData.auditor && caseData.auditor.trim() !== '') {
          status = AUDIT_STATUS_ENUM.IN_PROGRESS;
        } else {
          status = AUDIT_STATUS_ENUM.PENDING;
        }
        
        state.auditData[caseData.id] = {
          isCompleted: caseData.isCompleted,
          isIncorrect: false,
          completionDate: caseData.isCompleted ? createISODateString(new Date()) : null,
          userId: ensureUserId(caseData.userId),
          quarter: caseData.quarter,
          year: parseInt(caseData.quarter.split('-')[1]),
          steps: {},
          auditor: ensureUserId(caseData.auditor),
          comment: caseData.comment ?? '',
          rating: (caseData.rating ?? '') as RatingValue,
          specialFindings: convertToFindingsRecord(caseData.specialFindings),
          detailedFindings: convertToFindingsRecord(caseData.detailedFindings),
          status: status,
          caseType: CASE_TYPE_ENUM.PRE_LOADED,
          coverageAmount: caseData.coverageAmount,
          claimsStatus: caseData.claimsStatus as CLAIMS_STATUS_ENUM,
          dossierName: `Case ${caseData.id}`,
          notifiedCurrency: caseData.notifiedCurrency ?? CURRENCY.CHF
        };
      });
    },
  },
});

// Export UI actions
export const {
  setCurrentUser,
  updateAuditStatus,
  updateAuditInProgress,
  completeAudit,
  setUserRole,
  storeQuarterlyAudits,
  storeAllCasesForQuarter,
  loadPreLoadedCases,
} = auditUISlice.actions;

// Enhanced selectors that work with RTK Query cache

export const selectAuditData = (state: RootState) => state.auditUI.auditData;
export const selectUserQuarterlyStatus = (state: RootState) => state.auditUI.userQuarterlyStatus;
const selectUserRoles = (state: RootState) => state.auditUI.userRoles;

// Selector to get user role
export const selectUserRole = createSelector(
  [selectUserRoles, (_state: RootState, userId: string) => userId],
  (userRoles, userId) => {
    return userRoles[userId] ?? { role: USER_ROLE_ENUM.STAFF, department: '' };
  }
);

// Quarterly audits selector
export const selectQuarterlyAuditsForPeriod = createSelector(
  [selectAuditData, (_state: RootState, quarterKey: string) => quarterKey],
  (auditData, quarterKey): QuarterlyAuditsSelector => {
    if (!quarterKey?.includes('-')) {
      return {
        userQuarterlyAudits: [],
        previousQuarterRandomAudits: [],
        quarterDisplayCases: [],
        preLoadedCases: [],
        lastSelectionDate: null
      };
    }

    // Get all audits stored in Redux
    const allAudits = Object.entries(auditData)
      .map(([id, audit]) => ({ id, ...audit }))
      .filter(audit => audit); // Only keep valid audits
    
    // Separate by case type - but always include PRE_LOADED cases regardless of quarter
    const userQuarterlyAudits = allAudits
      .filter(audit => audit.caseType === CASE_TYPE_ENUM.USER_QUARTERLY);
    
    const previousQuarterRandomAudits = allAudits
      .filter(audit => audit.caseType === CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM);
    
    // Quarter display cases (when a quarter is selected from dropdown)
    const quarterDisplayCases = allAudits
      .filter(audit => audit.caseType === CASE_TYPE_ENUM.QUARTER_DISPLAY);
    
    // Pre-loaded cases (verified and in-progress cases that appear on initial load)
    // These should always appear regardless of quarter selection
    const preLoadedCases = allAudits
      .filter(audit => audit.caseType === CASE_TYPE_ENUM.PRE_LOADED);
    
    return {
      userQuarterlyAudits,
      previousQuarterRandomAudits,
      quarterDisplayCases,
      preLoadedCases,
      lastSelectionDate: null
    };
  }
);

// Export the UI reducer as default
export default auditUISlice.reducer;