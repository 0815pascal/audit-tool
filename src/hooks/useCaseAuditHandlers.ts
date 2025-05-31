import { useState, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectUserQuarterlyStatus,
  selectUsersNeedingAudits,
  completeAudit,
  getCurrentQuarter,
  initializeState,
  updateAuditStatus,
  selectQuarterlyAuditsForPeriod,
  selectUserRole,
  selectAuditData,
  formatQuarterYear,
  setCurrentUser,
  setUserRole,
  fetchCurrentUser,
  storeQuarterlyAudits
} from '../store/caseAuditSlice';
import {
  CaseAuditStatus,
  QuarterPeriod,
  FindingsRecord,
  CaseAuditData,
  RatingValue,
  CaseAudit,
  ClaimsStatus
} from '../types/types';
import {
  CaseAuditId,
  UserId,
  ValidYear
} from '../types/brandedTypes';
import {
  ensureUserId,
  createValidYear,
  createUserId,
  createEmptyFindings,
  createISODateString,
  createPolicyId,
  createCaseId,
  createCaseAuditId,
} from '../types/typeHelpers';
import { useUsers } from './useUsers';
import {
  TAB_VIEWS,
  ACTION_STATUS,
  COVERAGE_LIMITS,
  QUARTER_CALCULATIONS
} from '../constants';
import { CLAIMS_STATUS_ENUM, CASE_TYPE_ENUM, DEFAULT_VALUE_ENUM, USER_ROLE_ENUM, AUDIT_STATUS_ENUM, TAB_VIEW_ENUM } from '../enums';
import { mapAuditStatusToCaseAuditStatus } from '../utils/statusUtils';
import { selectCasesForAudit } from '../services';

// Tab view type alias
type TabView = TAB_VIEW_ENUM;

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
    formatQuarterYear(currentQuarter.quarter, currentQuarter.year)
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
  
  // Get audit data from Redux store
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
  
  // Calculate audit count
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
        role: user.authorities,
        department: user.department || 'Unknown'
      }));
    }
    
    // Also update local state
    await handleSelectUser(userId);
  };
  
  // Handle quarter change
  const handleQuarterChange = (quarterKey: QuarterPeriod) => {
    setSelectedQuarter(quarterKey);
  };
  
  // Handle year change
  const handleYearChange = (year: number) => {
    setFilteredYear(createValidYear(year));
  };
  
  // Handle complete audit
  const handleCompleteAudit = (auditId: CaseAuditId | string, auditor: UserId | string, caseAuditData: CaseAuditData): void => {
    try {
      const auditIdTyped = typeof auditId === 'string' ? createCaseAuditId(auditId) : auditId;
      const auditorTyped = ensureUserId(auditor);
      
      // Dispatch complete audit action
      dispatch(completeAudit({
        auditId: auditIdTyped,
        userId: currentUserId,
        auditor: auditorTyped,
        comment: caseAuditData.comment,
        rating: caseAuditData.rating,
        specialFindings: caseAuditData.specialFindings,
        detailedFindings: caseAuditData.detailedFindings
      }));

      // Update status to completed
      dispatch(updateAuditStatus({
        auditId: auditIdTyped,
        userId: currentUserId,
        status: AUDIT_STATUS_ENUM.COMPLETED
      }));

      console.log(`Audit ${auditId} completed by ${auditor}`);
    } catch (error) {
      console.error('Error completing audit:', error);
    }
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
  
  // Check if a user can complete an audit
  const canCompleteAuditCheck = (auditId: CaseAuditId | string): boolean => {
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
      
      // Special case: If audit is IN_PROGRESS and current user is the auditor, allow them to continue
      if (audit.status === mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.IN_PROGRESS)) {
        // Convert auditor to string for comparison
        const auditorString = audit.auditor ? String(audit.auditor) : '';
        const currentUserString = String(currentUserId);
        
        if (auditorString === currentUserString) {
          // User can continue their own in-progress audit
          return true;
        } else if (auditorString && auditorString !== currentUserString) {
          // Another user is working on this audit - current user cannot perform it
          return false;
        }
        // If no auditor is set yet, continue with normal rules below
      }
      
      // Team leaders can't complete their own audits - must be completed by a specialist
      if (currentUserRole.role === USER_ROLE_ENUM.TEAM_LEADER && audit.userId === currentUserId) {
        return false;
      }
      
      // Make sure coverageAmount is defined before comparing
      const coverageAmount = audit.coverageAmount;
      
      // Check coverage limits based on role
      if (currentUserRole.role === USER_ROLE_ENUM.STAFF && coverageAmount > COVERAGE_LIMITS.STAFF) {
        return false;
      }
      
      return !(currentUserRole.role === USER_ROLE_ENUM.SPECIALIST && coverageAmount > COVERAGE_LIMITS.SPECIALIST);
      

    } catch (error) {
      console.error('Error checking if user can complete audit:', error);
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
  const handleSelectQuarterlyAudits = async (quarterKey: QuarterPeriod): Promise<void> => {
    try {
      setLoadingStatus(ACTION_STATUS.loading);
      
      // Use the quarter key as is
      const quarterPeriod = quarterKey;
      
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
          id: String(caseObj.caseNumber), // Convert to string
          auditId: createCaseAuditId(String(caseObj.caseNumber)),
          userId: String(caseObj.claimOwner.userId), // Convert to string
          status: String(AUDIT_STATUS_ENUM.PENDING), // Convert to string
          auditor: '', // No auditor assigned yet
          coverageAmount: caseObj.coverageAmount,
          isCompleted: false,
          claimsStatus: String(caseObj.claimsStatus), // Convert to string
          quarter: actualQuarter, // Use the calculated quarter from notification date
          isAkoReviewed: false,
          notifiedCurrency: caseObj.notifiedCurrency || 'CHF', // Include the currency from API response
          caseType: String(CASE_TYPE_ENUM.USER_QUARTERLY) // Add the missing caseType property
        };
        
        console.log(`[DEBUG] Created audit object:`, auditObj);
        return auditObj;
      });
      
      // Split the cases: first 8 are current quarter, last 2 are from previous quarter
      const currentQuarterAudits = userQuarterlyAudits.slice(0, 8);
      const previousQuarterRandomAudits = userQuarterlyAudits.slice(8, 10);
      
      console.log(`Selected ${currentQuarterAudits.length} current quarter audits and ${previousQuarterRandomAudits.length} previous quarter audits`);
      
      // Dispatch the storeQuarterlyAudits action to store the fetched audits in Redux
      dispatch(storeQuarterlyAudits({
        audits: currentQuarterAudits
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
    auditor?: string;
    coverageAmount?: number;
    claimsStatus?: ClaimsStatus;
    comment?: string;
    rating?: string;
    specialFindings?: FindingsRecord;
    detailedFindings?: FindingsRecord;
    isCompleted?: boolean;
    isAkoReviewed?: boolean;
    [key: string]: unknown; // Allow additional properties
  }

  // Convert external audit format to our CaseAudit type
  const auditToCaseAudit = (audit: ExternalAuditData): CaseAudit => {
    // Create a base CaseAudit object with defaults
    const defaultAudit: CaseAudit = {
      id: createCaseAuditId(audit.id || String(Date.now())),
      userId: ensureUserId(audit.userId ?? currentUserId),
      date: createISODateString(),
      clientName: `Client ${audit.id || 'Unknown'}`,
      policyNumber: createPolicyId(DEFAULT_VALUE_ENUM.SAMPLE_POLICY_ID),
      caseNumber: createCaseId(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER),
      dossierRisk: 0,
      dossierName: `Case ${audit.id || 'Unknown'}`,
      totalAmount: audit.coverageAmount ?? 0,
      coverageAmount: audit.coverageAmount ?? 0,
      isCompleted: audit.isCompleted || false,
      isAkoReviewed: audit.isAkoReviewed || false,
      isSpecialist: false,
      quarter: selectedQuarter,
      year: filteredYear,
      claimsStatus: audit.claimsStatus ?? CLAIMS_STATUS_ENUM.FULL_COVER,
      auditor: ensureUserId(audit.auditor ?? ''),
      comment: audit.comment ?? '',
      rating: (audit.rating ?? '') as RatingValue,
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
    handleCompleteAudit,
    handleStatusChange,
    auditToCaseAudit,
    getRandomAuditForUser,
    handleQuarterChange,
    handleYearChange,
    canCompleteAudit: canCompleteAuditCheck,
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
