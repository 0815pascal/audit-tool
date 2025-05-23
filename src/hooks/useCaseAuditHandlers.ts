import { useState, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectUserQuarterlyStatus,
  selectUsersNeedingAudits,
  verifyAudit,
  rejectAudit,
  getCurrentQuarter,
  initializeState,
  updateAuditStatus,
  selectQuarterlyAuditsForPeriod,
  selectUserRole,
  selectQuarterlyAudits,
  selectAuditData,
  formatQuarterYear,
  setCurrentUser,
  setUserRole,
  fetchCurrentUser
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
  createEmptyFindings,
  createISODateString,
  createPolicyId,
  createCaseId
} from '../types';
import {
  CaseAudit,
  CaseAuditData,
  CaseAuditId,
  CaseAuditStatus,
  createCaseAuditId
} from '../caseAuditTypes';
import { TabView } from '../components/TabNavigationTypes';
import { useUsers } from './useUsers';
import {
  TAB_VIEWS,
  ACTION_STATUS
} from '../constants';
import { CLAIMS_STATUS_ENUM, CASE_TYPE_ENUM, DEFAULT_VALUE_ENUM, USER_ROLE_ENUM, VERIFICATION_STATUS_ENUM } from '../enums';
import { mapVerificationStatusToCaseAuditStatus } from '../utils/statusUtils';

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
    
    dispatch(verifyAudit({
      auditId: auditIdBranded,
      userId: currentUserId,
      verifier: verifierBranded,
      isVerified: true, // Add the required property
      ...caseAuditData
    }));
  };
  
  // Handle reject audit
  const handleReject = (auditId: CaseAuditId | string, verifier: UserId | string, caseAuditData: CaseAuditData): void => {
    const auditIdBranded = typeof auditId === 'string' ? createCaseAuditId(auditId) : auditId;
    const verifierBranded = ensureUserId(verifier);
    
    dispatch(rejectAudit({
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
      if (currentUserRole.role === USER_ROLE_ENUM.STAFF && coverageAmount > 30000) {
        return false;
      }
      
      if (currentUserRole.role === USER_ROLE_ENUM.SPECIALIST && coverageAmount > 150000) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking if user can verify audit:', error);
      return false;
    }
  };
  
  // Handle selecting quarterly audits
  const handleSelectQuarterlyAudits = async (quarterKey: QuarterPeriod | string): Promise<void> => {
    try {
      setLoadingStatus(ACTION_STATUS.loading);
      
      // Use the quarter key as is
      const quarterPeriod = quarterKey as QuarterPeriod;
      
      // Generate user quarterly audits (one per active user)
      const userQuarterlyAudits = usersList
        .filter(user => user.isActive && user.role !== 'READER') // Exclude readers and inactive users
        .map(user => {
          const auditId = createCaseAuditId(`QUARTERLY-${user.id}-${Date.now()}`);
          
          // Generate coverage amount based on user role (within limits)
          let maxCoverage = 30000; // Default for staff
          if (user.role === USER_ROLE_ENUM.SPECIALIST) {
            maxCoverage = 150000;
          } else if (user.role === USER_ROLE_ENUM.TEAM_LEADER) {
            maxCoverage = 150000; // Team leaders can handle same as specialists
          }
          
          const coverageAmount = Math.floor(Math.random() * maxCoverage * 0.8) + 1000; // Random amount up to 80% of max
          
          return {
            id: auditId,
            auditId,
            userId: ensureUserId(user.id),
            coverageAmount,
            claimsStatus: Math.random() > 0.3 ? CLAIMS_STATUS_ENUM.FULL_COVER : CLAIMS_STATUS_ENUM.PARTIAL_COVER,
            isAkoReviewed: false,
            status: VERIFICATION_STATUS_ENUM.NOT_VERIFIED,
            verifier: '',
            comment: '',
            rating: '',
            specialFindings: createEmptyFindings(),
            detailedFindings: createEmptyFindings(),
            isVerified: false
          };
        });
      
      // Generate 2 random audits from "previous quarter" for quality control
      const previousQuarterRandomAudits = Array.from({ length: 2 }).map((_, index) => {
        const auditId = createCaseAuditId(`PREV-QUARTER-${Date.now()}-${index}`);
        const coverageAmount = Math.floor(Math.random() * 100000) + 5000; // Random amount 5k-105k
        
        return {
          id: auditId,
          auditId,
          userId: ensureUserId(''), // Random audits not tied to specific user
          coverageAmount,
          claimsStatus: Math.random() > 0.3 ? CLAIMS_STATUS_ENUM.FULL_COVER : CLAIMS_STATUS_ENUM.PARTIAL_COVER,
          isAkoReviewed: false,
          status: VERIFICATION_STATUS_ENUM.NOT_VERIFIED,
          verifier: '',
          comment: '',
          rating: '',
          specialFindings: createEmptyFindings(),
          detailedFindings: createEmptyFindings(),
          isVerified: false
        };
      });
      
      // Dispatch the selection with actual audit data
      dispatch(selectQuarterlyAudits({
        quarterKey: quarterPeriod,
        userQuarterlyAudits,
        previousQuarterRandomAudits
      }));
      
      setLoadingStatus(ACTION_STATUS.idle); // Reset to idle after completing
    } catch (error) {
      console.error('Error selecting quarterly audits:', error);
      setLoadingStatus(ACTION_STATUS.idle); // Reset to idle after error
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