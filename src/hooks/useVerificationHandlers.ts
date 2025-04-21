import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectVerificationData,
  selectEmployeeQuarterlyStatus,
  selectEmployeesNeedingVerification,
  applyVerificationDataToInvoice,
  verifyStep,
  markStepIncorrect,
  addStepComment,
  verifyInvoice,
  getCurrentQuarter,
  formatQuarterYear,
  initializeState
} from '../store/verificationSlice';
import { Invoice } from '../types';
import { getRandomInvoiceForEmployee, invoices, employees } from '../mockData';
import { TabView } from '../components/TabNavigation';

export const useVerificationHandlers = () => {
  const [activeTab, setActiveTab] = useState<TabView>('verification');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

  // Get verification data from Redux store
  const verificationData = useAppSelector(selectVerificationData);
  const employeeQuarterlyStatus = useAppSelector(selectEmployeeQuarterlyStatus);
  const employeesNeedingVerification = useAppSelector(state =>
    selectEmployeesNeedingVerification(state, employees)
  );
  const { quarter, year } = getCurrentQuarter();
  const currentQuarterFormatted = formatQuarterYear(quarter, year);
  const dispatch = useAppDispatch();

  // Initialize state when the component mounts
  useEffect(() => {
    dispatch(initializeState());
  }, [dispatch]);

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
  };

  const handleSelectInvoiceFromTable = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setSelectedEmployee(invoice.employeeId);
      const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
      setCurrentInvoice(updatedInvoice);
      setActiveTab('verification');
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      const invoice = getRandomInvoiceForEmployee(employeeId, quarter, year);
      if (invoice) {
        const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
        setCurrentInvoice(updatedInvoice);
      } else {
        setCurrentInvoice(null);
      }
    } else {
      setCurrentInvoice(null);
    }
  };

  const handleVerifyStep = (stepId: string, isVerified: boolean) => {
    if (!currentInvoice || !selectedEmployee) {
      return;
    }

    dispatch(verifyStep({
      invoiceId: currentInvoice.id,
      stepId,
      isVerified,
      employeeId: selectedEmployee
    }));

    const updatedInvoice = {
      ...currentInvoice,
      calculationSteps: currentInvoice.calculationSteps.map(step =>
        step.id === stepId ? {
          ...step,
          isVerified,
          isIncorrect: isVerified ? false : step.isIncorrect
        } : step
      )
    };

    setCurrentInvoice(updatedInvoice);
  };

  const handleMarkStepIncorrect = (stepId: string, isIncorrect: boolean) => {
    if (!currentInvoice || !selectedEmployee) {
      return;
    }

    dispatch(markStepIncorrect({
      invoiceId: currentInvoice.id,
      stepId,
      isIncorrect,
      employeeId: selectedEmployee
    }));

    const updatedInvoice = {
      ...currentInvoice,
      calculationSteps: currentInvoice.calculationSteps.map(step =>
        step.id === stepId ? {
          ...step,
          isIncorrect,
          isVerified: isIncorrect ? false : step.isVerified
        } : step
      )
    };

    setCurrentInvoice(updatedInvoice);
  };

  const handleAddComment = (stepId: string, comment: string) => {
    if (!currentInvoice || !selectedEmployee) {
      return;
    }

    dispatch(addStepComment({
      invoiceId: currentInvoice.id,
      stepId,
      comment,
      employeeId: selectedEmployee
    }));

    const updatedInvoice = {
      ...currentInvoice,
      calculationSteps: currentInvoice.calculationSteps.map(step =>
        step.id === stepId ? { ...step, comment } : step
      )
    };

    setCurrentInvoice(updatedInvoice);
  };

  const handleVerifyInvoice = (isVerified: boolean) => {
    if (!currentInvoice || !selectedEmployee) {
      return;
    }

    dispatch(verifyInvoice({
      invoiceId: currentInvoice.id,
      isVerified,
      employeeId: selectedEmployee
    }));

    const updatedInvoice = {
      ...currentInvoice,
      isVerified
    };

    setCurrentInvoice(updatedInvoice);

    // Trigger a re-render of the EmployeeList to update the status indicator
    setTimeout(() => {
      setSelectedEmployee(prevEmployee => String(prevEmployee));
    }, 50);
  };

  const handleSelectNewInvoice = () => {
    if (!selectedEmployee) {
      return;
    }

    const invoice = getRandomInvoiceForEmployee(selectedEmployee, quarter, year);
    if (invoice) {
      const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
      setCurrentInvoice(updatedInvoice);
    } else {
      alert(`No invoices found for this employee in ${currentQuarterFormatted}`);
    }
  };

  // Add event listener for the selectRandomInvoice custom event
  useEffect(() => {
    const handleSelectRandomInvoiceEvent = () => {
      handleSelectNewInvoice();
    };

    window.addEventListener('selectRandomInvoice', handleSelectRandomInvoiceEvent);

    return () => {
      window.removeEventListener('selectRandomInvoice', handleSelectRandomInvoiceEvent);
    };
  }, [selectedEmployee, quarter, year, verificationData, currentQuarterFormatted]);

  return {
    activeTab,
    selectedEmployee,
    currentInvoice,
    currentQuarterFormatted,
    employeesNeedingVerification,
    totalEmployees: employees.length,
    employeeQuarterlyStatus,
    verificationData,
    handleTabChange,
    handleSelectInvoiceFromTable,
    handleSelectEmployee,
    handleVerifyStep,
    handleMarkStepIncorrect,
    handleAddComment,
    handleVerifyInvoice,
    handleSelectNewInvoice
  };
}; 