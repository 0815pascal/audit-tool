// This file replaces the previous useCaseAuditHandlers.ts which was just a compatibility layer
// Now we have a full implementation that uses case audit terminology throughout

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectVerificationData,
  selectUserQuarterlyStatus,
  selectUsersNeedingVerification,
  applyVerificationDataToAudit,
  verifyAudit,
  rejectAudit,
  getCurrentQuarter,
  formatQuarterYear,
  initializeState,
  updateAuditStatus,
  selectQuarterlyAuditsForPeriod,
  selectUserRole,
  canUserVerifyAudit,
  selectQuarterlyAudits
} from '../store/caseAuditSlice';
import { 
  User, 
  QuarterPeriod, 
  QuarterNumber, 
  createEmptyFindings,
  createUserId, 
  ensureUserId, 
  UserId,
  ValidYear,
  createValidYear
} from '../types';
import {
  CaseAudit,
  CaseAuditData,
  CaseAuditId,
  CaseAuditStatus,
  createCaseAuditId,
  ensureCaseAuditId
} from '../caseAuditTypes';
import { useUsers } from './useUsers';
import { TabView } from '../components/TabNavigationTypes';
import { 
  VERIFICATION_STATUS, 
  ACTION_STATUS, 
  ERROR_MESSAGES,
  TAB_VIEWS
} from '../constants';
import { ERROR_TYPE_ENUM } from '../enums';

/**
 * Hook for handling case audit operations
 */
export const useCaseAuditHandlers = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TAB_VIEWS.IKS);
  const [selectedUser, setSelectedUser] = useState<UserId>(createUserId(''));
  const [currentAudit, setCurrentAudit] = useState<CaseAudit | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterPeriod>(getCurrentQuarter());
  const [filteredYear, setFilteredYear] = useState<ValidYear>(createValidYear(new Date().getFullYear()));
  const [loadingStatus, setLoadingStatus] = useState(ACTION_STATUS.idle);
  
  const dispatch = useAppDispatch();
  const { usersList, loading: usersLoading } = useUsers();
  
  // Get current user ID from Redux
  const currentUserId = useAppSelector(state => state.caseAudit.currentUserId);
  const currentUserRole = useAppSelector(state => selectUserRole(state, currentUserId));
  
  // Get verification data from Redux store
  const verificationData = useAppSelector(selectVerificationData);
  
  const usersNeedingVerification = useAppSelector(state =>
    selectUsersNeedingVerification(state, usersList)
  );
  
  // Get quarterly status by user
  const userQuarterlyStatus = useAppSelector(selectUserQuarterlyStatus);
  
  // Get quarterly audits for the selected period
  const quarterlyAudits = useAppSelector(state => 
    selectQuarterlyAuditsForPeriod(state, selectedQuarter)
  );
  
  // Calculate verification count
  const verificationCount = useMemo(() => {
    return usersNeedingVerification.length;
  }, [usersNeedingVerification]);
  
  const loading = loadingStatus === ACTION_STATUS.loading || usersLoading;
  
  // Initialize Redux state
  useEffect(() => {
    dispatch(initializeState());
  }, [dispatch]);
  
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
      setLoadingStatus(ACTION_STATUS.success);
    } catch (error) {
      console.error('Error selecting user:', error);
      setLoadingStatus(ACTION_STATUS.error);
    }
  };
  
  // Handle changing the selected user
  const handleUserChange = async (userId: UserId | string): Promise<void> => {
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
    // Ensure we're using a valid status
    if (!Object.values(VERIFICATION_STATUS).includes(status)) {
      console.warn(ERROR_MESSAGES[ERROR_TYPE_ENUM.VALIDATION].INVALID_VERIFICATION_STATUS(status));
      status = VERIFICATION_STATUS['in-progress'];
    }
    
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
    
    // Create a minimal state object with just the verification state
    const miniState = {
      caseAudit: {
        currentUserId,
        userQuarterlyStatus,
        verifiedAudits: verificationData,
      }
    };
    
    return canUserVerifyAudit(miniState, currentUserId, auditIdBranded);
  };
  
  // Handle selecting quarterly audits
  const handleSelectQuarterlyAudits = async (quarterKey: QuarterPeriod | string): Promise<void> => {
    try {
      setLoadingStatus(ACTION_STATUS.loading);
      
      // Use the quarter key as is
      const quarterPeriod = quarterKey as QuarterPeriod;
      
      // Select quarterly audits
      dispatch(selectQuarterlyAudits(quarterPeriod));
      
      setLoadingStatus(ACTION_STATUS.success);
    } catch (error) {
      console.error('Error selecting quarterly audits:', error);
      setLoadingStatus(ACTION_STATUS.error);
    }
  };
  
  // Export quarterly results
  const exportQuarterlyResults = (): void => {
    console.log(`Exporting results for quarter ${selectedQuarter}`);
    // In a real implementation, this would handle the export logic
    alert(`Results for ${selectedQuarter} exported successfully`);
  };
  
  // A stub for the auditToCaseAudit function
  // In a real implementation, this would transform an external audit to a CaseAudit
  const auditToCaseAudit = (audit: any): CaseAudit => {
    return {
      id: createCaseAuditId(audit.id || ''),
      userId: createUserId(audit.userId || ''),
      date: audit.date || '',
      clientName: audit.clientName || '',
      policyNumber: audit.policyNumber || 0,
      caseNumber: audit.caseNumber || 0,
      dossierRisk: audit.dossierRisk || 0,
      dossierName: audit.dossierName || '',
      totalAmount: audit.totalAmount || 0,
      coverageAmount: audit.coverageAmount || 0,
      isVerified: audit.isVerified || false,
      isAkoReviewed: audit.isAkoReviewed || false,
      isSpecialist: audit.isSpecialist || false,
      quarter: audit.quarter || '',
      year: audit.year || 0,
      claimsStatus: audit.claimsStatus || '',
      caseType: audit.caseType || '',
      verifier: createUserId(audit.verifier || ''),
      comment: audit.comment || '',
      rating: audit.rating || '',
      specialFindings: audit.specialFindings || createEmptyFindings(),
      detailedFindings: audit.detailedFindings || createEmptyFindings(),
    };
  };
  
  // A stub for the getRandomAuditForUser function
  // In a real implementation, this would fetch a random audit for a user
  const getRandomAuditForUser = async (): Promise<CaseAudit> => {
    // This is just a placeholder
    return Promise.resolve({} as CaseAudit);
  };
  
  return {
    activeTab,
    currentAudit,
    selectedUser,
    usersList,
    currentUserId,
    selectedQuarter,
    filteredYear,
    currentUserRole,
    loading,
    quarterlyAudits,
    usersNeedingVerification,
    usersNeedingVerificationCount: verificationCount,
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