import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectUserQuarterlyStatus,
  selectUsersNeedingAudits,
  verifyAudit,
  rejectAudit,
  getCurrentQuarter,
  initializeState,
  updateAuditStatus,
  updateAuditInProgress,
  verifyStep,
  markStepIncorrect,
  updateStepComment,
  selectQuarterlyAuditsForPeriod,
  selectUserRole,
  selectQuarterlyAudits,
  selectAuditData,
  formatQuarterYear,
  setCurrentUser,
  setUserRole,
  fetchCurrentUser,
  verifyAuditThunk,
  rejectAuditThunk
} from '../store/caseAuditSlice';
import {
  QuarterPeriod,
  ensureUserId,
  UserId,
  ValidYear,
  createValidYear,
  createUserId,
  ClaimsStatus,
  RatingValue,
  FindingsRecord,
  FindingType,
  DetailedFindingsRecord,
  SpecialFindingsRecord,
  QuarterlyStatus,
  createEmptyFindings,
  createEmptyDetailedFindings,
  createEmptySpecialFindings,
  createISODateString,
  createPolicyId,
  createCaseId,
  formatQuarterPeriod,
  isDetailedFinding,
  isSpecialFinding
} from '../types';
import {
  CaseAudit,
  CaseAuditData,
  CaseAuditId,
  CaseAuditStatus,
  CaseAuditStep,
  StoredCaseAuditData,
  createCaseAuditId
} from '../types';
import { TAB_VIEW_ENUM } from '../enums';

// Tab view type alias
type TabView = TAB_VIEW_ENUM;
import { useUsers } from './useUsers';
import {
  TAB_VIEWS,
  ACTION_STATUS,
  COVERAGE_LIMITS,
  QUARTER_CALCULATIONS
} from '../constants';
import { CLAIMS_STATUS_ENUM, CASE_TYPE_ENUM, DEFAULT_VALUE_ENUM, USER_ROLE_ENUM, VERIFICATION_STATUS_ENUM } from '../enums';
import { mapVerificationStatusToCaseAuditStatus } from '../utils/statusUtils';
import { selectCasesForAudit } from '../services/auditService';

/**
 * Hook for handling case audit operations
 */
export const useCaseAuditHandlers = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TAB_VIEWS.IKS);
  const [selectedUser, setSelectedUser] = useState<UserId>(createUserId(''));
  const [, setCurrentAudit] = useState<CaseAudit | null>(null);
  
  // Fix: Convert Quarter object to QuarterPeriod string
  const currentQuarter = getCurrentQuarter();
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterPeriod>(
    formatQuarterYear(currentQuarter.quarter, currentQuarter.year) as QuarterPeriod
  );
  
  const [filteredYear, setFilteredYear] = useState<ValidYear>(createValidYear(new Date().getFullYear()));
  const [loadingStatus, setLoadingStatus] = useState(ACTION_STATUS.idle);
  
  // Add ref to track if we've already tried to fetch current user
  const hasFetchedCurrentUser = useRef(false);
  
  const dispatch = useAppDispatch();
  const { activeUsers: usersList, isLoading: usersLoading } = useUsers();
  
  // Get current user ID from Redux
  const currentUserId = useAppSelector(state => state.caseAudit.currentUserId);
  const currentUserRole = useAppSelector(state => selectUserRole(state, currentUserId));
  
  // Get verification data from Redux store
  const auditData = useAppSelector(selectAuditData);
  
  const usersNeedingAudits = useAppSelector(state =>
    selectUsersNeedingAudits(state, usersList)
  );
  
  // Get quarterly status by user
  const userQuarterlyStatus = useAppSelector(selectUserQuarterlyStatus);
  
  // Get quarterly audits for the selected period
  const quarterlyAudits = useAppSelector(state => 
    selectQuarterlyAuditsForPeriod(state, selectedQuarter)
  );
  
  // Calculate verification count
  const auditCount = useMemo(() => {
    return usersNeedingAudits.length;
  }, [usersNeedingAudits]);
  
  const loading = loadingStatus === ACTION_STATUS.loading || usersLoading;
  
  // Initialize Redux state and fetch current user
  useEffect(() => {
    dispatch(initializeState());
    
    // Only fetch current user once if we don't have one already
    if ((!currentUserId || currentUserId === '') && !hasFetchedCurrentUser.current) {
      hasFetchedCurrentUser.current = true;
      dispatch(fetchCurrentUser()); // Fetch current user from API
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // Remove currentUserId from dependency array to prevent infinite loop
  
  // Handle tab change
  const handleTabChange = (tab: TabView): void => {
    setActiveTab(tab);
  };
  
  // Handle selecting a user
  const handleSelectUser = async (userId: UserId | string): Promise<void> => {
    try {
      setLoadingStatus(ACTION_STATUS.loading);
      const userIdBranded = ensureUserId(userId);
      setSelectedUser(userIdBranded);
      setLoadingStatus(ACTION_STATUS.idle); // Reset status to idle after completing
    } catch (error) {
      console.error('Error selecting user:', error);
      setLoadingStatus(ACTION_STATUS.idle); // Reset status to idle after error
    }
  };
  
  // Handle changing the selected user
  const handleUserChange = async (userId: UserId | string): Promise<void> => {
    // Update Redux state
    const userIdString = typeof userId === 'string' ? userId : String(userId);
    dispatch(setCurrentUser(userIdString));
    
    // Find the user in the users list and set their role
    const user = usersList.find(u => u.id === userIdString);
    if (user) {
      dispatch(setUserRole({
        userId: userIdString,
        role: user.role,
        department: user.department || 'Unknown'
      }));
    }
    
    // Also update local state
    await handleSelectUser(userId);
  };
  
  // Handle quarter change
  const handleQuarterChange = (quarterKey: QuarterPeriod | string) => {
    setSelectedQuarter(quarterKey as QuarterPeriod);
  };
  
  // Handle year change
  const handleYearChange = (year: number) => {
    setFilteredYear(createValidYear(year));
  };
  
  // Handle verify audit
  const handleVerify = (auditId: CaseAuditId | string, verifier: UserId | string, caseAuditData: CaseAuditData): void => {
    const auditIdBranded = typeof auditId === 'string' ? createCaseAuditId(auditId) : auditId;
    const verifierBranded = ensureUserId(verifier);
    
    // First update local Redux state
    dispatch(verifyAudit({
      auditId: auditIdBranded,
      userId: currentUserId,
      verifier: verifierBranded,
      isVerified: true,
      ...caseAuditData
    }));
    
    // Then persist to backend API
    dispatch(verifyAuditThunk({
      auditId: auditIdBranded,
      userId: currentUserId,
      verifier: verifierBranded,
      isVerified: true,
      ...caseAuditData
    }));
  };
  
  // Handle reject audit
  const handleReject = (auditId: CaseAuditId | string, verifier: UserId | string, caseAuditData: CaseAuditData): void => {
    const auditIdBranded = typeof auditId === 'string' ? createCaseAuditId(auditId) : auditId;
    const verifierBranded = ensureUserId(verifier);
    
    // First update local Redux state
    dispatch(rejectAudit({
      auditId: auditIdBranded,
      userId: currentUserId,
      verifier: verifierBranded,
      ...caseAuditData
    }));
    
    // Then persist to backend API
    dispatch(rejectAuditThunk({
      auditId: auditIdBranded,
      userId: currentUserId,
      verifier: verifierBranded,
      ...caseAuditData
    }));
  };
  
  // Handle status change
  const handleStatusChange = (status: CaseAuditStatus, auditId: CaseAuditId | string): void => {
    const auditIdBranded = typeof auditId === 'string' ? createCaseAuditId(auditId) : auditId;
    
    dispatch(updateAuditStatus({
      auditId: auditIdBranded,
      userId: currentUserId,
      status
    }));
  };
  
  // Check if a user can verify an audit
  const canVerifyAudit = (auditId: CaseAuditId | string): boolean => {
    if (!currentUserId) {
      return false;
    }
    
    const auditIdBranded = typeof auditId === 'string' ? createCaseAuditId(auditId) : auditId;
    
    try {
      // Get the actual audit data from Redux
      const audit = auditData[auditIdBranded];
      if (!audit) {
        return false;
      }
      
      // Get the current user's role
      if (!currentUserRole) {
        return false;
      }
      
      // Special case: If audit is IN_PROGRESS and current user is the verifier, allow them to continue
      if (audit.status === mapVerificationStatusToCaseAuditStatus(VERIFICATION_STATUS_ENUM.IN_PROGRESS)) {
        // Convert verifier to string for comparison
        const verifierString = audit.verifier ? String(audit.verifier) : '';
        const currentUserString = String(currentUserId);
        
        if (verifierString === currentUserString) {
          // User can continue their own in-progress audit
          return true;
        } else if (verifierString && verifierString !== currentUserString) {
          // Another user is working on this audit - current user cannot verify
          return false;
        }
        // If no verifier is set yet, continue with normal rules below
      }
      
      // Team leaders can't verify their own audits - must be verified by a specialist
      if (currentUserRole.role === USER_ROLE_ENUM.TEAM_LEADER && audit.userId === currentUserId) {
        return false;
      }
      
      // Make sure coverageAmount is defined before comparing
      const coverageAmount = audit.coverageAmount;
      if (typeof coverageAmount !== 'number') {
        return false;
      }
      
      // Check coverage limits based on role
      if (currentUserRole.role === USER_ROLE_ENUM.STAFF && coverageAmount > COVERAGE_LIMITS.STAFF) {
        return false;
      }
      
      if (currentUserRole.role === USER_ROLE_ENUM.SPECIALIST && coverageAmount > COVERAGE_LIMITS.SPECIALIST) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking if user can verify audit:', error);
      return false;
    }
  };
  
  // Helper function to calculate quarter from notification date
  const getQuarterFromNotificationDate = (notificationDate: string): QuarterPeriod => {
    const date = new Date(notificationDate);
    const month = date.getMonth(); // 0-indexed (0 = January, 11 = December)
    const year = date.getFullYear();
    const quarterNum = Math.floor(month / QUARTER_CALCULATIONS.MONTHS_PER_QUARTER) + QUARTER_CALCULATIONS.QUARTER_OFFSET; // Convert to 1-indexed quarter (1-4)
    
    return `Q${quarterNum}-${year}` as QuarterPeriod;
  };

  // Handle selecting quarterly audits
  const handleSelectQuarterlyAudits = async (quarterKey: QuarterPeriod | string): Promise<void> => {
    try {
      setLoadingStatus(ACTION_STATUS.loading);
      
      // Use the quarter key as is
      const quarterPeriod = quarterKey as QuarterPeriod;
      
      // Call the API to get cases for audit selection using the correct endpoint
      const cases = await selectCasesForAudit(quarterPeriod);
      
      console.log(`[API] Retrieved ${cases.length} cases for quarter ${quarterPeriod}`);
      
      // Convert the CaseObj response to the format expected by Redux
      // Each case becomes an audit that needs to be verified
      const userQuarterlyAudits = cases.map((caseObj, index) => {
        // Calculate the actual quarter from the notification date
        const actualQuarter = caseObj.notificationDate ? 
          getQuarterFromNotificationDate(caseObj.notificationDate) : 
          quarterPeriod; // fallback to requested quarter if no notification date
        
        console.log(`[DEBUG] Case ${index + 1}: notificationDate=${caseObj.notificationDate}, actualQuarter=${actualQuarter}, notifiedCurrency=${caseObj.notifiedCurrency}`);
        
        const auditObj = {
          id: createCaseAuditId(String(caseObj.caseNumber)),
          auditId: createCaseAuditId(String(caseObj.caseNumber)),
          userId: ensureUserId(String(caseObj.claimOwner.userId)),
          status: VERIFICATION_STATUS_ENUM.NOT_VERIFIED,
          verifier: '', // No verifier assigned yet
          coverageAmount: caseObj.coverageAmount,
          isVerified: false,
          claimsStatus: caseObj.claimsStatus,
          quarter: actualQuarter, // Use the calculated quarter from notification date
          isAkoReviewed: false,
          notifiedCurrency: caseObj.notifiedCurrency || 'CHF' // Include the currency from API response
        };
        
        console.log(`[DEBUG] Created audit object:`, auditObj);
        return auditObj;
      });
      
      // Split the cases: first 8 are current quarter, last 2 are from previous quarter
      const currentQuarterAudits = userQuarterlyAudits.slice(0, 8);
      const previousQuarterRandomAudits = userQuarterlyAudits.slice(8, 10);
      
      // Store the quarterly selection in Redux
      dispatch(selectQuarterlyAudits({
        quarterKey: quarterPeriod,
        userQuarterlyAudits: currentQuarterAudits,
        previousQuarterRandomAudits
      }));
      
      setLoadingStatus(ACTION_STATUS.idle);
    } catch (error) {
      console.error('Error selecting quarterly audits:', error);
      setLoadingStatus(ACTION_STATUS.idle);
      throw error;
    }
  };
  
  // Export quarterly results
  const exportQuarterlyResults = (): void => {
    console.log(`Exporting results for quarter ${selectedQuarter}`);
    // In a real implementation, this would handle the export logic
    alert(`Results for ${selectedQuarter} exported successfully`);
  };
  
  // Define a more specific type for external audit data
  interface ExternalAuditData {
    id: string;
    userId?: string;
    status?: string;
    verifier?: string;
    coverageAmount?: number;
    claimsStatus?: ClaimsStatus;
    comment?: string;
    rating?: string;
    specialFindings?: FindingsRecord;
    detailedFindings?: FindingsRecord;
    isVerified?: boolean;
    isAkoReviewed?: boolean;
    [key: string]: unknown; // Allow additional properties
  }

  // Convert external audit format to our CaseAudit type
  const auditToCaseAudit = (audit: ExternalAuditData): CaseAudit => {
    // Create a base CaseAudit object with defaults
    const defaultAudit: CaseAudit = {
      id: createCaseAuditId(audit.id || String(Date.now())),
      userId: ensureUserId(audit.userId || currentUserId),
      date: createISODateString(),
      clientName: `Client ${audit.id || 'Unknown'}`,
      policyNumber: createPolicyId(DEFAULT_VALUE_ENUM.SAMPLE_POLICY_ID),
      caseNumber: createCaseId(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER),
      dossierRisk: 0,
      dossierName: `Case ${audit.id || 'Unknown'}`,
      totalAmount: audit.coverageAmount || 0,
      coverageAmount: audit.coverageAmount || 0,
      isVerified: audit.isVerified || false,
      isAkoReviewed: audit.isAkoReviewed || false,
      isSpecialist: false,
      quarter: selectedQuarter,
      year: filteredYear,
      claimsStatus: audit.claimsStatus || CLAIMS_STATUS_ENUM.FULL_COVER,
      verifier: ensureUserId(audit.verifier || ''),
      comment: audit.comment || '',
      rating: (audit.rating || '') as RatingValue,
      specialFindings: audit.specialFindings || createEmptyFindings(),
      detailedFindings: audit.detailedFindings || createEmptyFindings(),
      caseType: CASE_TYPE_ENUM.USER_QUARTERLY
    };
    
    // Merge with any additional properties from the audit
    const result = { ...defaultAudit, ...audit } as CaseAudit;
    
    // Save the current audit in state for potential future use
    setCurrentAudit(result);
    
    return result;
  };
  
  // A stub for the getRandomAuditForUser function
  // In a real implementation, this would fetch a random audit for a user
  const getRandomAuditForUser = async (): Promise<CaseAudit> => {
    // This is just a placeholder
    return Promise.resolve({} as CaseAudit);
  };
  
  return {
    activeTab,
    selectedUser,
    usersList,
    currentUserId,
    selectedQuarter,
    filteredYear,
    currentUserRole,
    loading,
    quarterlyAudits,
    usersNeedingAudits,
    usersNeedingAuditsCount: auditCount,
    userQuarterlyStatus,
    
    handleTabChange,
    handleSelectUser,
    handleUserChange,
    handleVerify,
    handleReject,
    handleStatusChange,
    auditToCaseAudit,
    getRandomAuditForUser,
    handleQuarterChange,
    handleYearChange,
    canVerifyAudit,
    handleSelectQuarterlyAudits,
    exportQuarterlyResults
  };
};

/**
 * Lightweight hook for tab navigation
 * Extracted from useCaseAuditHandlers to prevent unnecessary API calls
 */
export const useTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TAB_VIEWS.IKS);

  // Handle tab change
  const handleTabChange = (tab: TabView): void => {
    setActiveTab(tab);
  };

  return {
    activeTab,
    handleTabChange
  };
};

// ===== MERGED FROM useCaseAuditState.ts =====

interface UseCaseAuditStateOptions {
  auditId?: string;
  userId?: string;
}

interface UseFindingsOptions {
  initialFindings?: FindingsRecord;
}

// Define the return type for findings functionality
export interface UseFindingsReturn {
  findings: FindingsRecord;
  toggleFinding: (finding: FindingType, value?: boolean) => void;
  setMultipleFindings: (updates: Partial<FindingsRecord>) => void;
  resetFindings: () => void;
  getDetailedFindings: () => DetailedFindingsRecord;
  getSpecialFindings: () => SpecialFindingsRecord;
  hasSelectedFindings: () => boolean;
  countDetailedFindings: () => number;
  countSpecialFindings: () => number;
}

/**
 * Hook for safely accessing and updating case audit state
 */
export function useCaseAuditState(options: UseCaseAuditStateOptions = {}) {
  const dispatch = useAppDispatch();
  const { auditId, userId } = options;

  // Get stored audit data for a case
  const auditData = useAppSelector(state => {
    if (!auditId) return undefined;
    return state.caseAudit.verifiedAudits[auditId];
  });

  // Get quarterly status for a user
  const quarterlyStatus = useAppSelector(state => {
    if (!userId) return undefined;
    
    const { quarter, year } = getCurrentQuarter();
    const quarterKey = formatQuarterPeriod(quarter, year);
    
    return state.caseAudit.userQuarterlyStatus[userId]?.[quarterKey];
  });

  // Current audit status
  const auditStatus = auditData?.status || CaseAuditStatus.NOT_VERIFIED;

  // Check if audit is verified
  const isVerified = auditData?.isVerified || false;

  // Save audit data (in-progress)
  const saveAuditData = useCallback((data: CaseAuditData, verifier: string) => {
    if (!auditId || !userId) {
      console.error('Cannot save audit data: auditId or userId missing');
      return;
    }
    
    dispatch(updateAuditInProgress({
      auditId: createCaseAuditId(auditId),
      userId: createUserId(userId),
      verifier: createUserId(verifier),
      ...data
    }));
  }, [dispatch, auditId, userId]);

  // Verify audit
  const doVerifyAudit = useCallback((data: CaseAuditData, verifier: string) => {
    if (!auditId || !userId) {
      console.error('Cannot verify audit: auditId or userId missing');
      return;
    }
    
    dispatch(verifyAudit({
      auditId: createCaseAuditId(auditId),
      userId: createUserId(userId),
      isVerified: true,
      verifier: createUserId(verifier),
      ...data
    }));
  }, [dispatch, auditId, userId]);

  // Reject audit
  const doRejectAudit = useCallback((data: CaseAuditData, verifier: string) => {
    if (!auditId || !userId) {
      console.error('Cannot reject audit: auditId or userId missing');
      return;
    }
    
    dispatch(rejectAudit({
      auditId: createCaseAuditId(auditId),
      userId: createUserId(userId),
      verifier: createUserId(verifier),
      ...data
    }));
  }, [dispatch, auditId, userId]);

  // Update audit status
  const updateStatus = useCallback((status: CaseAuditStatus) => {
    if (!auditId || !userId) {
      console.error('Cannot update status: auditId or userId missing');
      return;
    }
    
    dispatch(updateAuditStatus({
      auditId: createCaseAuditId(auditId),
      userId: createUserId(userId),
      status
    }));
  }, [dispatch, auditId, userId]);

  // Verify step
  const doVerifyStep = useCallback((stepId: string, isVerified: boolean) => {
    if (!auditId || !userId) {
      console.error('Cannot verify step: auditId or userId missing');
      return;
    }
    
    dispatch(verifyStep({
      auditId: createCaseAuditId(auditId),
      userId: createUserId(userId),
      stepId,
      isVerified
    }));
  }, [dispatch, auditId, userId]);

  // Mark step as incorrect
  const doMarkStepIncorrect = useCallback((stepId: string, isIncorrect: boolean) => {
    if (!auditId || !userId) {
      console.error('Cannot mark step incorrect: auditId or userId missing');
      return;
    }
    
    dispatch(markStepIncorrect({
      auditId: createCaseAuditId(auditId),
      userId: createUserId(userId),
      stepId,
      isIncorrect
    }));
  }, [dispatch, auditId, userId]);

  // Add step comment
  const doUpdateStepComment = useCallback((stepId: string, comment: string) => {
    if (!auditId || !userId) {
      console.error('Cannot add step comment: auditId or userId missing');
      return;
    }
    
    dispatch(updateStepComment({
      auditId: createCaseAuditId(auditId),
      userId: createUserId(userId),
      stepId,
      comment
    }));
  }, [dispatch, auditId, userId]);

  // Get audit step
  const getAuditStep = useCallback((stepId: string): CaseAuditStep | undefined => {
    if (!auditData) return undefined;
    return auditData.steps[stepId];
  }, [auditData]);

  return {
    // State
    auditData,
    quarterlyStatus,
    auditStatus,
    isVerified,
    
    // Actions
    saveAuditData,
    verifyAudit: doVerifyAudit,
    rejectAudit: doRejectAudit,
    updateStatus,
    verifyStep: doVerifyStep,
    markStepIncorrect: doMarkStepIncorrect,
    updateStepComment: doUpdateStepComment,
    
    // Helpers
    getAuditStep
  };
}

/**
 * Hook for managing findings in a type-safe way
 */
export function useFindings(options: UseFindingsOptions = {}): UseFindingsReturn {
  const { initialFindings = createEmptyFindings() } = options;
  const [findings, setFindings] = useState<FindingsRecord>(initialFindings);

  // Toggle a specific finding
  const toggleFinding = useCallback((finding: FindingType, value?: boolean) => {
    setFindings(prev => ({
      ...prev,
      [finding]: value !== undefined ? value : !prev[finding]
    }));
  }, []);

  // Set multiple findings at once
  const setMultipleFindings = useCallback((updates: Partial<FindingsRecord>) => {
    setFindings(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset all findings to false
  const resetFindings = useCallback(() => {
    setFindings(createEmptyFindings());
  }, []);

  // Get only detailed findings
  const getDetailedFindings = useCallback((): DetailedFindingsRecord => {
    const detailedFindings = createEmptyDetailedFindings();
    Object.entries(findings).forEach(([key, value]) => {
      if (isDetailedFinding(key as FindingType)) {
        (detailedFindings as any)[key] = value;
      }
    });
    return detailedFindings;
  }, [findings]);

  // Get only special findings
  const getSpecialFindings = useCallback((): SpecialFindingsRecord => {
    const specialFindings = createEmptySpecialFindings();
    Object.entries(findings).forEach(([key, value]) => {
      if (isSpecialFinding(key as FindingType)) {
        (specialFindings as any)[key] = value;
      }
    });
    return specialFindings;
  }, [findings]);

  // Check if any findings are selected
  const hasSelectedFindings = useCallback((): boolean => {
    return Object.values(findings).some(value => value === true);
  }, [findings]);

  // Count detailed findings
  const countDetailedFindings = useCallback((): number => {
    return Object.entries(findings).filter(([key, value]) => 
      isDetailedFinding(key as FindingType) && value === true
    ).length;
  }, [findings]);

  // Count special findings
  const countSpecialFindings = useCallback((): number => {
    return Object.entries(findings).filter(([key, value]) => 
      isSpecialFinding(key as FindingType) && value === true
    ).length;
  }, [findings]);

  return {
    findings,
    toggleFinding,
    setMultipleFindings,
    resetFindings,
    getDetailedFindings,
    getSpecialFindings,
    hasSelectedFindings,
    countDetailedFindings,
    countSpecialFindings
  };
} 