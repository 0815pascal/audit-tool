import { useCallback, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  QuarterlyStatus,
  formatQuarterPeriod,
  createUserId,
  FindingsRecord, 
  FindingType, 
  DetailedFindingsRecord,
  SpecialFindingsRecord,
  createEmptyFindings,
  createEmptyDetailedFindings,
  createEmptySpecialFindings,
  isDetailedFinding,
  isSpecialFinding
} from '../types';
import {
  verifyAudit,
  rejectAudit,
  updateAuditInProgress,
  updateAuditStatus,
  verifyStep,
  markStepIncorrect,
  updateStepComment,
  getCurrentQuarter
} from '../store/caseAuditSlice';
import {
  createCaseAuditId,
  CaseAuditData,
  CaseAuditStatus,
  CaseAuditStep,
  StoredCaseAuditData
} from '../types';

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

  type CaseAuditStateReturn = {
  // State
  auditData: StoredCaseAuditData | undefined;
  quarterlyStatus: QuarterlyStatus | undefined;
  auditStatus: CaseAuditStatus;
  isVerified: boolean;
  
  // Actions
  saveAuditData: (data: CaseAuditData, verifier: string) => void;
  verifyAudit: (data: CaseAuditData, verifier: string) => void;
  rejectAudit: (data: CaseAuditData, verifier: string) => void;
  updateStatus: (status: CaseAuditStatus) => void;
  verifyStep: (stepId: string, isVerified: boolean) => void;
  markStepIncorrect: (stepId: string, isIncorrect: boolean) => void;
  updateStepComment: (stepId: string, comment: string) => void;
  
  // Helpers
  getAuditStep: (stepId: string) => CaseAuditStep | undefined;
};

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
  } as CaseAuditStateReturn;
}

/**
 * Hook for managing findings in a type-safe way
 */
export function useFindings(options: UseFindingsOptions = {}): UseFindingsReturn {
  const [findings, setFindings] = useState<FindingsRecord>(
    options.initialFindings || createEmptyFindings()
  );

  // Toggle a finding state
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

  // Reset findings to default state
  const resetFindings = useCallback(() => {
    setFindings(createEmptyFindings());
  }, []);

  // Get just the detailed findings
  const getDetailedFindings = useCallback((): DetailedFindingsRecord => {
    const detailedFindings = createEmptyDetailedFindings();
    
    Object.keys(findings).forEach(key => {
      const finding = key as FindingType;
      if (isDetailedFinding(finding)) {
        detailedFindings[finding] = findings[finding];
      }
    });
    
    return detailedFindings;
  }, [findings]);

  // Get just the special findings
  const getSpecialFindings = useCallback((): SpecialFindingsRecord => {
    const specialFindings = createEmptySpecialFindings();
    
    Object.keys(findings).forEach(key => {
      const finding = key as FindingType;
      if (isSpecialFinding(finding)) {
        specialFindings[finding] = findings[finding];
      }
    });
    
    return specialFindings;
  }, [findings]);

  // Check if any finding is selected
  const hasSelectedFindings = useCallback((): boolean => {
    return Object.values(findings).some(Boolean);
  }, [findings]);

  // Count the number of selected detailed findings
  const countDetailedFindings = useCallback((): number => {
    return Object.entries(findings)
      .filter(([key]) => isDetailedFinding(key as FindingType))
      .filter(([, value]) => value)
      .length;
  }, [findings]);

  // Count the number of selected special findings
  const countSpecialFindings = useCallback((): number => {
    return Object.entries(findings)
      .filter(([key]) => isSpecialFinding(key as FindingType))
      .filter(([, value]) => value)
      .length;
  }, [findings]);

  // Use the explicit return type
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