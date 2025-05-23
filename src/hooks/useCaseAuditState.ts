import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  QuarterlyStatus,
  formatQuarterPeriod,
  createUserId
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
} from '../caseAuditTypes';

interface UseCaseAuditStateOptions {
  auditId?: string;
  userId?: string;
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