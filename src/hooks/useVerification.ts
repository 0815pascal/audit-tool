import { useCallback } from 'react'
import { useAppDispatch } from '../store/hooks'
import { 
  verifyStep,
  markStepIncorrect,
  addStepComment,
  verifyInvoice
} from '../store/verificationSlice'

export function useVerification(employeeId: string) {
  const dispatch = useAppDispatch()

  const handleVerifyStep = useCallback(
    (invoiceId: string, stepId: string, isVerified: boolean) => {
      dispatch(verifyStep({
        invoiceId,
        stepId,
        isVerified,
        employeeId
      }))
    },
    [dispatch, employeeId]
  )

  const handleMarkStepIncorrect = useCallback(
    (invoiceId: string, stepId: string, isIncorrect: boolean) => {
      dispatch(markStepIncorrect({
        invoiceId,
        stepId,
        isIncorrect,
        employeeId
      }))
    },
    [dispatch, employeeId]
  )

  const handleAddComment = useCallback(
    (invoiceId: string, stepId: string, comment: string) => {
      dispatch(addStepComment({
        invoiceId,
        stepId,
        comment,
        employeeId
      }))
    },
    [dispatch, employeeId]
  )

  const handleVerifyInvoice = useCallback(
    (invoiceId: string, isVerified: boolean) => {
      dispatch(verifyInvoice({
        invoiceId,
        isVerified,
        employeeId
      }))
    },
    [dispatch, employeeId]
  )

  return {
    handleVerifyStep,
    handleMarkStepIncorrect,
    handleAddComment,
    handleVerifyInvoice,
  }
} 