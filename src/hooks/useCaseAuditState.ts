import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  VerificationData,
  StoredVerificationData,
  VerificationStatus,
  QuarterlyStatus,
  formatQuarterPeriod,
  VerificationStep,
  createUserId,
  createVerificationAuditId
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
  const auditStatus = auditData?.status || 'not-verified';

  // Check if audit is verified
  const isVerified = auditData?.isVerified || false;

  // Save audit data (in-progress)
  const saveAuditData = useCallback((data: VerificationData, verifier: string) => {
    if (!auditId || !userId) {
      console.error('Cannot save audit data: auditId or userId missing');
      return;
    }
    
    dispatch(updateAuditInProgress({
      auditId: createVerificationAuditId(auditId),
      userId: createUserId(userId),
      verifier: createUserId(verifier),
      ...data
    }));
  }, [dispatch, auditId, userId]);

  // Verify audit
  const doVerifyAudit = useCallback((data: VerificationData, verifier: string) => {
    if (!auditId || !userId) {
      console.error('Cannot verify audit: auditId or userId missing');
      return;
    }
    
    dispatch(verifyAudit({
      auditId: createVerificationAuditId(auditId),
      userId: createUserId(userId),
      isVerified: true,
      verifier: createUserId(verifier),
      ...data
    }));
  }, [dispatch, auditId, userId]);

  // Reject audit
  const doRejectAudit = useCallback((data: VerificationData, verifier: string) => {
    if (!auditId || !userId) {
      console.error('Cannot reject audit: auditId or userId missing');
      return;
    }
    
    dispatch(rejectAudit({
      auditId: createVerificationAuditId(auditId),
      userId: createUserId(userId),
      verifier: createUserId(verifier),
      ...data
    }));
  }, [dispatch, auditId, userId]);

  // Update audit status
  const updateStatus = useCallback((status: VerificationStatus) => {
    if (!auditId || !userId) {
      console.error('Cannot update status: auditId or userId missing');
      return;
    }
    
    dispatch(updateAuditStatus({
      auditId: createVerificationAuditId(auditId),
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
      auditId: createVerificationAuditId(auditId),
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
      auditId: createVerificationAuditId(auditId),
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
      auditId: createVerificationAuditId(auditId),
      userId: createUserId(userId),
      stepId,
      comment
    }));
  }, [dispatch, auditId, userId]);

  // Get audit step
  const getAuditStep = useCallback((stepId: string): VerificationStep | undefined => {
    if (!auditData) return undefined;
    return auditData.steps[stepId];
  }, [auditData]);

  type CaseAuditStateReturn = {
    // State
    auditData: StoredVerificationData | undefined;
    quarterlyStatus: QuarterlyStatus | undefined;
    auditStatus: VerificationStatus;
    isVerified: boolean;
    
    // Actions
    saveAuditData: (data: VerificationData, verifier: string) => void;
    verifyAudit: (data: VerificationData, verifier: string) => void;
    rejectAudit: (data: VerificationData, verifier: string) => void;
    updateStatus: (status: VerificationStatus) => void;
    verifyStep: (stepId: string, isVerified: boolean) => void;
    markStepIncorrect: (stepId: string, isIncorrect: boolean) => void;
    updateStepComment: (stepId: string, comment: string) => void;
    
    // Helpers
    getAuditStep: (stepId: string) => VerificationStep | undefined;
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

// For backward compatibility
export type UseVerificationStateOptions = UseCaseAuditStateOptions;

/**
 * @deprecated Use useCaseAuditState instead
 */
export function useVerificationState(options: UseVerificationStateOptions = {}) {
  const caseAuditState = useCaseAuditState(options);
  
  // Map the new names to the old interface
  return {
    verificationData: caseAuditState.auditData,
    quarterlyStatus: caseAuditState.quarterlyStatus,
    verificationStatus: caseAuditState.auditStatus,
    isVerified: caseAuditState.isVerified,
    
    saveVerificationData: caseAuditState.saveAuditData,
    verifyAudit: caseAuditState.verifyAudit,
    rejectAudit: caseAuditState.rejectAudit,
    updateStatus: caseAuditState.updateStatus,
    verifyStep: caseAuditState.verifyStep,
    markStepIncorrect: caseAuditState.markStepIncorrect,
    updateStepComment: caseAuditState.updateStepComment,
    
    getVerificationStep: caseAuditState.getAuditStep
  };
} 