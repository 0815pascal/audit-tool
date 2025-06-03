import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectUserQuarterlyStatus,
  completeAudit,
  getCurrentQuarter,
  updateAuditStatus,
  selectQuarterlyAuditsForPeriod,
  selectUserRole,
  selectAuditData,
  formatQuarterYear,
  setCurrentUser,
  setUserRole,
  storeQuarterlyAudits,
  storeAllCasesForQuarter,
  useGetCurrentUserQuery,
  useCompleteAuditMutation,
  useGetPreLoadedCasesQuery,
  loadPreLoadedCases
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
  ACTION_STATUS,
  COVERAGE_LIMITS,
  QUARTER_CALCULATIONS
} from '../constants';
import { CLAIMS_STATUS_ENUM, CASE_TYPE_ENUM, DEFAULT_VALUE_ENUM, USER_ROLE_ENUM, AUDIT_STATUS_ENUM } from '../enums';
import { mapAuditStatusToCaseAuditStatus } from '../utils/statusUtils';
import { selectCasesForAudit, getAllCasesByQuarter } from '../services';

/**
 * Hook for handling case audit operations
 */
export const useCaseAuditHandlers = () => {
  const [selectedUser, setSelectedUser] = useState<UserId>(createUserId(''));
  const [, setCurrentAudit] = useState<CaseAudit | null>(null);
  
  // Fix: Convert Quarter object to QuarterPeriod string
  const currentQuarter = getCurrentQuarter();
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterPeriod>(
    formatQuarterYear(currentQuarter.quarter, currentQuarter.year)
  );
  
  const [filteredYear, setFilteredYear] = useState<ValidYear>(createValidYear(new Date().getFullYear()));
  const [loadingStatus, setLoadingStatus] = useState(ACTION_STATUS.idle);
  
  const dispatch = useAppDispatch();
  const { activeUsers: usersList, isLoading: usersLoading } = useUsers();
  
  // Get current user ID from Redux
  const currentUserId = useAppSelector(state => state.auditUI.currentUserId);
  const currentUserRole = useAppSelector(state => selectUserRole(state, currentUserId));
  
  // Get audit data from Redux store
  const auditData = useAppSelector(selectAuditData);
  
  // For now, calculate users needing audits locally since we don't have this selector anymore
  const usersNeedingAudits = useMemo(() => {
    // Simple implementation - return all users for now
    return usersList;
  }, [usersList]);
  
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
  
  const loading: boolean = loadingStatus === ACTION_STATUS.loading || Boolean(usersLoading);
  
  // Use RTK Query to get current user
  const { data: currentUser } = useGetCurrentUserQuery();
  
  // RTK Query mutation for completing audits
  const [completeAuditMutation] = useCompleteAuditMutation();
  
  // Initialize Redux state and fetch current user
  useEffect(() => {
    // Set current user from RTK Query result
    if (currentUser && (!currentUserId || currentUserId === '')) {
      dispatch(setCurrentUser(currentUser.id.toString()));
      dispatch(setUserRole({
        userId: currentUser.id.toString(),
        role: currentUser.authorities,
        department: currentUser.department ?? 'Unknown'
      }));
    }
  }, [dispatch, currentUser, currentUserId]); // Add currentUser to dependencies
  
  // Load pre-loaded cases (verified and in-progress) on app initialization
  const { data: preLoadedCases } = useGetPreLoadedCasesQuery();
  
  useEffect(() => {
    if (preLoadedCases && preLoadedCases.length > 0) {
      console.log(`Loading ${preLoadedCases.length} pre-loaded cases for immediate display...`);
      // Store pre-loaded cases in Redux and show them immediately
      // These represent already completed/in-progress work
      dispatch(loadPreLoadedCases(preLoadedCases));
    }
  }, [dispatch, preLoadedCases]);
  
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
        department: user.department ?? 'Unknown'
      }));
    }
    
    // Also update local state
    await handleSelectUser(userId);
  };
  
  // Handle quarter change
  const handleQuarterChange = async (quarterKey: QuarterPeriod) => {
    setSelectedQuarter(quarterKey);
    
    // Automatically load all cases for this quarter
    try {
      setLoadingStatus(ACTION_STATUS.loading);
      
      const cases = await getAllCasesByQuarter(quarterKey);
      
      // Convert cases to the format expected by Redux
      const casesForStore = cases.map((caseObj) => {
        // Calculate the actual quarter from the notification date for display purposes
        const actualQuarter = caseObj.notificationDate ? 
          getQuarterFromNotificationDate(caseObj.notificationDate) : 
          quarterKey; // fallback to requested quarter if no notification date
        
        return {
          id: String(caseObj.caseNumber),
          userId: String(caseObj.claimOwner.userId),
          coverageAmount: caseObj.coverageAmount,
          claimsStatus: String(caseObj.claimsStatus),
          quarter: actualQuarter,
          notifiedCurrency: caseObj.notifiedCurrency ?? 'CHF'
        };
      });
      
      // Store all cases for this quarter
      dispatch(storeAllCasesForQuarter({
        quarter: quarterKey,
        cases: casesForStore
      }));
      
      setLoadingStatus(ACTION_STATUS.idle);
    } catch (error) {
      console.error('Error loading cases for quarter:', error);
      setLoadingStatus(ACTION_STATUS.idle);
    }
  };
  
  // Handle year change
  const handleYearChange = (year: number) => {
    setFilteredYear(createValidYear(year));
  };
  
  // Handle complete audit
  const handleCompleteAudit = async (auditId: CaseAuditId | string, auditor: UserId | string, caseAuditData: CaseAuditData): Promise<void> => {
    try {
      const auditIdString = typeof auditId === 'string' ? auditId : String(auditId);
      const auditorString = typeof auditor === 'string' ? auditor : String(auditor);
      
      // First, ensure the audit exists in Redux state before trying to complete it
      const currentAuditData = auditData[auditIdString];
      if (!currentAuditData) {
        // Create a default audit entry if it doesn't exist
        dispatch(storeQuarterlyAudits({
          audits: [{
            id: auditIdString,
            userId: currentUserId ?? '1',
            status: 'pending',
            auditor: auditorString,
            coverageAmount: 0,
            isCompleted: false,
            claimsStatus: 'FULL_COVER',
            quarter: selectedQuarter ?? 'Q1-2025',
            isAkoReviewed: false,
            caseType: 'USER_QUARTERLY',
            comment: caseAuditData.comment,
            rating: caseAuditData.rating,
            specialFindings: caseAuditData.specialFindings,
            detailedFindings: caseAuditData.detailedFindings
          }]
        }));
        // Wait a bit for the state to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Call the RTK Query mutation to make the actual API call
      await completeAuditMutation({
        auditId: auditIdString,
        auditor: auditorString,
        rating: caseAuditData.rating,
        comment: caseAuditData.comment,
        specialFindings: caseAuditData.specialFindings,
        detailedFindings: caseAuditData.detailedFindings,
        status: 'completed',
        isCompleted: true
      }).unwrap();
      
      // Update local Redux state for immediate UI updates
      dispatch(completeAudit({
        auditId: typeof auditId === 'string' ? createCaseAuditId(auditId) : auditId,
        userId: ensureUserId(currentUserId),
        auditor: ensureUserId(auditor),
        comment: caseAuditData.comment,
        rating: caseAuditData.rating,
        specialFindings: caseAuditData.specialFindings,
        detailedFindings: caseAuditData.detailedFindings
      }));
      
      // Add a small delay to ensure Redux state has propagated to components
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Error completing audit with RTK Query:', error);
      throw error; // Re-throw to let the UI handle the error
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

      // Team leaders can't complete their own audits - must be completed by a specialist
      if (currentUserRole.role === USER_ROLE_ENUM.TEAM_LEADER && audit.userId === currentUserId) {
        return false;
      }

      // Special case: If audit is IN_PROGRESS
      if (audit.status === mapAuditStatusToCaseAuditStatus(AUDIT_STATUS_ENUM.IN_PROGRESS)) {
        // Convert auditor to string for comparison
        const auditorString = audit.auditor ? String(audit.auditor) : '';
        const currentUserString = String(currentUserId);
        
        if (auditorString === currentUserString) {
          // The assigned auditor can continue working → allowed
          return true;
        } else if (audit.userId === currentUserId) {
          // Case owners (even non-TEAM_LEADERs) cannot work on their own IN_PROGRESS cases → blocked
          return false;
        } else {
          // Other users (who are neither the case owner nor the current auditor) can interfere → allowed
          // But only if they have sufficient role (TEAM_LEADER or SPECIALIST)
          return currentUserRole.role === USER_ROLE_ENUM.TEAM_LEADER || currentUserRole.role === USER_ROLE_ENUM.SPECIALIST;
        }
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
      
      // Ensure pre-loaded cases are available in Redux before counting
      // They might have been cleared by quarter dropdown changes
      if (preLoadedCases && preLoadedCases.length > 0) {
        dispatch(loadPreLoadedCases(preLoadedCases));
        // Wait a moment for Redux to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Count existing pre-loaded cases more reliably
      // Check both the selector and the raw audit data for PRE_LOADED cases
      const currentPreLoadedCases = quarterlyAudits.preLoadedCases ?? [];
      const preLoadedFromRedux = Object.values(auditData).filter(audit => 
        audit.caseType === CASE_TYPE_ENUM.PRE_LOADED
      );
      
      // Use the maximum count to ensure we don't miss any pre-loaded cases
      const preLoadedCount = Math.max(
        currentPreLoadedCases.length, 
        preLoadedFromRedux.length,
        preLoadedCases ? preLoadedCases.length : 0 // Also check API data
      );
      
      // Call the API to get cases for audit selection, passing the pre-loaded count
      const cases = await selectCasesForAudit(quarterPeriod, preLoadedCount);
      
      // Convert the CaseObj response to the format expected by Redux
      // Each case becomes an audit that needs to be verified
      const userQuarterlyAudits = cases.map((caseObj) => {
        // Calculate the actual quarter from the notification date for display purposes
        // This ensures the Quarter column shows the correct value (Q1-2025 vs Q2-2025)
        const actualQuarter = caseObj.notificationDate ? 
          getQuarterFromNotificationDate(caseObj.notificationDate) : 
          quarterPeriod; // fallback to requested quarter if no notification date
        
        // Determine if this case is from the current quarter or previous quarter
        const isCurrentQuarter = actualQuarter === quarterPeriod;
        const caseType = isCurrentQuarter ? 
          CASE_TYPE_ENUM.USER_QUARTERLY : 
          CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM;
        
        const auditObj = {
          id: String(caseObj.caseNumber), // Convert to string
          auditId: createCaseAuditId(String(caseObj.caseNumber)),
          userId: String(caseObj.claimOwner.userId), // Convert to string
          status: String(AUDIT_STATUS_ENUM.PENDING), // Convert to string
          auditor: '', // No auditor assigned yet
          coverageAmount: caseObj.coverageAmount,
          isCompleted: false,
          claimsStatus: String(caseObj.claimsStatus), // Convert to string
          quarter: actualQuarter, // Use the actual quarter from notification date for display
          isAkoReviewed: false,
          notifiedCurrency: caseObj.notifiedCurrency ?? 'CHF', // Include the currency from API response
          caseType: String(caseType) // Set caseType based on whether it's current or previous quarter
        };
        
        return auditObj;
      });
      
      // Dispatch the storeQuarterlyAudits action to store all fetched audits in Redux
      // With pre-loaded cases consideration: total will be exactly 8
      dispatch(storeQuarterlyAudits({
        audits: userQuarterlyAudits
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
    // In a real implementation, this would handle the export logic
    // For now, this is a placeholder function
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
      id: createCaseAuditId(audit.id ?? String(Date.now())),
      userId: ensureUserId(audit.userId ?? currentUserId),
      date: createISODateString(),
      clientName: `Client ${audit.id ?? 'Unknown'}`,
      policyNumber: createPolicyId(DEFAULT_VALUE_ENUM.SAMPLE_POLICY_ID),
      caseNumber: createCaseId(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER),
      dossierRisk: 0,
      dossierName: `Case ${audit.id ?? 'Unknown'}`,
      totalAmount: audit.coverageAmount ?? 0,
      coverageAmount: audit.coverageAmount ?? 0,
      isCompleted: audit.isCompleted ?? false,
      isAkoReviewed: audit.isAkoReviewed ?? false,
      isSpecialist: false,
      quarter: selectedQuarter ?? 'Q1-2025',
      year: filteredYear,
      claimsStatus: audit.claimsStatus ?? CLAIMS_STATUS_ENUM.FULL_COVER,
      auditor: ensureUserId(audit.auditor ?? ''),
      comment: audit.comment ?? '',
      rating: (audit.rating ?? '') as RatingValue,
      specialFindings: audit.specialFindings ?? createEmptyFindings(),
      detailedFindings: audit.detailedFindings ?? createEmptyFindings(),
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
