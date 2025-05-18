import { useState, useEffect, useCallback } from 'react';
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
import { getAuditsByQuarter, getAuditsByAuditor, selectCasesForAudit, AuditRecord } from '../services/auditService';
import { TabView } from '../components/TabNavigation';

// Convert API audit format to our internal Invoice format
const auditToInvoice = (audit: AuditRecord): Invoice => {
  const { auditId, caseObj } = audit;
  const { caseNumber, claimOwner, coverageAmount } = caseObj || {};
  
  // Create calculation steps (4 default steps)
  const baseAmount = coverageAmount ? coverageAmount * 0.8 : 800;
  const calculationSteps = [
    { 
      id: `${auditId}-1`, 
      description: 'Base premium', 
      value: baseAmount, 
      isVerified: false, 
      isIncorrect: false, 
      comment: '' 
    },
    { 
      id: `${auditId}-2`, 
      description: 'Risk adjustment factor', 
      value: 1.2, 
      isVerified: false, 
      isIncorrect: false, 
      comment: '' 
    },
    { 
      id: `${auditId}-3`, 
      description: 'Regional discount', 
      value: -100, 
      isVerified: false, 
      isIncorrect: false, 
      comment: '' 
    },
    { 
      id: `${auditId}-4`, 
      description: 'Policy duration bonus', 
      value: -50, 
      isVerified: false, 
      isIncorrect: false, 
      comment: '' 
    }
  ];
  
  return {
    id: auditId.toString(),
    employeeId: claimOwner?.userId.toString() || '0',
    date: new Date().toISOString().split('T')[0], // Use current date
    clientName: `Client ${caseNumber || 'Unknown'}`,
    policyNumber: `POL-${caseNumber || '0000'}`,
    caseNumber: caseNumber || 0,
    dossierRisk: Math.floor(Math.random() * 10) + 1,
    dossierName: `Case ${caseNumber || '0000'}`,
    calculationSteps,
    totalAmount: coverageAmount || 1000,
    isVerified: false
  };
};

// Get a random audit for an employee and convert to invoice format
const getRandomAuditForEmployee = async (
  employeeId: string,
  quarter?: number,
  year?: number
): Promise<Invoice | null> => {
  try {
    // Format as API expects (e.g., "Q1-2023")
    const quarterStr = `Q${quarter || 1}-${year || new Date().getFullYear()}`;
    
    // First try to get audits for this employee
    const audits = await getAuditsByAuditor(parseInt(employeeId));
    
    if (audits && audits.length > 0) {
      // Find an audit for this quarter if possible
      const auditForQuarter = audits.find(audit => audit.quarter === quarterStr);
      const randomAudit = auditForQuarter || audits[Math.floor(Math.random() * audits.length)];
      return auditToInvoice(randomAudit);
    }
    
    // If no audits found, try to get available cases to create a new invoice
    const cases = await selectCasesForAudit(quarterStr);
    if (cases && cases.length > 0) {
      const randomCase = cases[Math.floor(Math.random() * cases.length)];
      // Create a mock audit based on the case
      const mockAudit: AuditRecord = {
        auditId: Math.floor(Math.random() * 10000) + 1,
        quarter: quarterStr,
        caseObj: randomCase,
        auditor: {
          userId: parseInt(employeeId),
          role: "SPECIALIST"
        }
      };
      return auditToInvoice(mockAudit);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting random audit for employee:", error);
    return null;
  }
};

export const useVerificationHandlers = () => {
  const [activeTab, setActiveTab] = useState<TabView>('verification');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [employeesList, setEmployeesList] = useState<Array<{id: string, name: string, department: string}>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [lastFetchedQuarter, setLastFetchedQuarter] = useState<string>('');

  // Get verification data from Redux store
  const verificationData = useAppSelector(selectVerificationData);
  const employeeQuarterlyStatus = useAppSelector(selectEmployeeQuarterlyStatus);
  const employeesNeedingVerification = useAppSelector(state =>
    selectEmployeesNeedingVerification(state, employeesList)
  );
  const { quarter, year } = getCurrentQuarter();
  const currentQuarterFormatted = formatQuarterYear(quarter, year);
  const dispatch = useAppDispatch();

  // Fetch employees and audits data - with caching to prevent loops
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Only fetch if we haven't fetched this quarter yet
        const quarterStr = `Q${quarter}-${year}`;
        if (quarterStr === lastFetchedQuarter && audits.length > 0) {
          return; // Skip if we've already fetched data for this quarter
        }
        
        setLoading(true);
        
        // Get audits for the current quarter
        const auditRecords = await getAuditsByQuarter(quarterStr);
        
        // Ensure auditRecords is a valid array before using it
        if (!auditRecords || !Array.isArray(auditRecords)) {
          console.error("API returned non-array data:", auditRecords);
          // Use empty array as fallback
          setAudits([]);
          setLastFetchedQuarter(quarterStr);
          
          // Use default employees if no valid audit data
          setEmployeesList([
            { id: '1', name: 'Employee 1', department: '5' },
            { id: '2', name: 'Employee 2', department: '5' },
            { id: '3', name: 'Employee 3', department: '5' },
          ]);
          setLoading(false);
          return;
        }
        
        setAudits(auditRecords);
        setLastFetchedQuarter(quarterStr);
        
        // Extract unique employees from audits
        const employees = Array.from(
          new Set(auditRecords.map(audit => audit.caseObj?.claimOwner?.userId.toString() || ''))
        ).filter(id => id !== '')
         .map(id => ({
           id,
           name: `Employee ${id}`,
           department: '5'
         }));
        
        // If we don't have enough employees, add some more
        if (employees.length < 5) {
          for (let i = employees.length + 1; i <= 5; i++) {
            employees.push({
              id: i.toString(),
              name: `Employee ${i}`,
              department: '5'
            });
          }
        }
        
        setEmployeesList(employees);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Add some default employees as fallback
        setEmployeesList([
          { id: '1', name: 'Employee 1', department: '5' },
          { id: '2', name: 'Employee 2', department: '5' },
          { id: '3', name: 'Employee 3', department: '5' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    // We only want to fetch when quarter or year changes
  }, [quarter, year, lastFetchedQuarter, audits.length]);

  // Initialize state when the component mounts
  useEffect(() => {
    dispatch(initializeState());
  }, [dispatch]);

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
  };

  const handleSelectInvoiceFromTable = (invoiceId: string) => {
    const audit = audits.find(a => a.auditId.toString() === invoiceId);
    if (audit) {
      const invoice = auditToInvoice(audit);
      setSelectedEmployee(invoice.employeeId);
      const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
      setCurrentInvoice(updatedInvoice);
      setActiveTab('verification');
    }
  };

  const handleSelectEmployee = useCallback(async (employeeId: string) => {
    setSelectedEmployee(employeeId);
    
    if (!employeeId) {
      setCurrentInvoice(null);
      return;
    }
    
    setLoading(true);
    
    try {
      // First, check if there are any invoices with verification data for this employee
      // in the current quarter
      const employeeVerifiedInvoices = Object.entries(verificationData)
        .filter(([, data]) => {
          // Check if this verification belongs to this employee and is from the current quarter
          return data.employeeId === employeeId && 
                data.quarter === quarter && 
                data.year === year;
        })
        .filter(([, data]) => {
          // Check if there's any verification data (fully verified or steps verified/incorrect)
          return data.isVerified || 
            Object.values(data.steps || {}).some(
              (step) => step.isVerified || step.isIncorrect
            );
        })
        .map(([invoiceId]) => invoiceId);
      
      // If we found any verified invoices, use the first one
      if (employeeVerifiedInvoices.length > 0) {
        const invoiceId = employeeVerifiedInvoices[0];
        const audit = audits.find(a => a.auditId.toString() === invoiceId);
        
        if (audit) {
          const invoice = auditToInvoice(audit);
          const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
          setCurrentInvoice(updatedInvoice);
          setLoading(false);
          return;
        }
      }
      
      // If no verified invoices were found, fall back to random selection
      const invoice = await getRandomAuditForEmployee(employeeId, quarter, year);
      if (invoice) {
        const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
        setCurrentInvoice(updatedInvoice);
      } else {
        setCurrentInvoice(null);
      }
    } catch (error) {
      console.error("Error selecting employee:", error);
      setCurrentInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [quarter, year, verificationData, audits]);

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

  const handleSelectNewInvoice = useCallback(async () => {
    if (!selectedEmployee) {
      return;
    }

    setLoading(true);
    try {
      const invoice = await getRandomAuditForEmployee(selectedEmployee, quarter, year);
      if (invoice) {
        const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
        setCurrentInvoice(updatedInvoice);
      } else {
        alert(`No invoices found for this employee in ${currentQuarterFormatted}`);
      }
    } catch (error) {
      console.error("Error selecting new invoice:", error);
      alert(`Failed to get a new invoice. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, quarter, year, verificationData, currentQuarterFormatted]);

  // Add event listener for the selectRandomInvoice custom event
  useEffect(() => {
    const handleSelectRandomInvoiceEvent = () => {
      handleSelectNewInvoice();
    };

    window.addEventListener('selectRandomInvoice', handleSelectRandomInvoiceEvent);

    return () => {
      window.removeEventListener('selectRandomInvoice', handleSelectRandomInvoiceEvent);
    };
  }, [handleSelectNewInvoice]);

  return {
    activeTab,
    selectedEmployee,
    currentInvoice,
    currentQuarterFormatted,
    employeesNeedingVerification,
    totalEmployees: employeesList.length,
    employeeQuarterlyStatus,
    verificationData,
    loading,
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