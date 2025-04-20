import React, {useState, useEffect} from 'react'
import './App.css'
import Header from './components/Header'
import EmployeeList from './components/EmployeeList'
import InvoiceDetails from './components/InvoiceDetails'
import VerificationStatus from './components/VerificationStatus.tsx'
import TabNavigation, {TabView} from './components/TabNavigation'
import VerifiedInvoicesTable from './components/VerifiedInvoicesTable'
import PastQuarterVerificationsTable from './components/PastQuarterVerificationsTable'
import {employees, getRandomInvoiceForEmployee, invoices} from './mockData'
import {Invoice} from './types'
import {useAppSelector, useAppDispatch} from './store/hooks'
import {
  selectVerificationData,
  selectEmployeeQuarterlyStatus,
  selectEmployeesNeedingVerification,
  getCurrentQuarter,
  formatQuarterYear,
  applyVerificationDataToInvoice,
  verifyStep,
  markStepIncorrect,
  addStepComment,
  verifyInvoice,
  initializeState
} from './store/verificationSlice'

function App() {
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

  // Handle tab change
  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab)
  };

  // Handle selecting an invoice from the table
  const handleSelectInvoiceFromTable = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      // Find the employee for this invoice
      setSelectedEmployee(invoice.employeeId);

      // Apply verification data
      const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
      setCurrentInvoice(updatedInvoice);

      // Switch to verification tab
      setActiveTab('verification')
    }
  };

  // Handle employee selection
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      // Get a random invoice for the employee from the current quarter only
      const invoice = getRandomInvoiceForEmployee(employeeId, quarter, year);

      // If we have an invoice, apply any existing verification data to it
      if (invoice) {
        const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
        setCurrentInvoice(updatedInvoice)
      } else {
        setCurrentInvoice(null)
      }
    } else {
      setCurrentInvoice(null)
    }
  };

  // Handle step verification
  const handleVerifyStep = (stepId: string, isVerified: boolean) => {
    if (!currentInvoice || !selectedEmployee) {
      return
    }

    // Dispatch action to Redux
    dispatch(verifyStep({
      invoiceId: currentInvoice.id,
      stepId,
      isVerified,
      employeeId: selectedEmployee
    }));

    // Update the current invoice with new verification data
    const updatedInvoice = {
      ...currentInvoice,
      calculationSteps: currentInvoice.calculationSteps.map(step =>
        step.id === stepId ? {
          ...step,
          isVerified,
          // If marking as verified, ensure isIncorrect is false
          isIncorrect: isVerified ? false : step.isIncorrect
        } : step
      )
    };

    setCurrentInvoice(updatedInvoice)
  };

  // Handle marking step as incorrect
  const handleMarkStepIncorrect = (stepId: string, isIncorrect: boolean) => {
    if (!currentInvoice || !selectedEmployee) {
      return
    }

    // Dispatch action to Redux
    dispatch(markStepIncorrect({
      invoiceId: currentInvoice.id,
      stepId,
      isIncorrect,
      employeeId: selectedEmployee
    }));

    // Update the current invoice with new incorrectness data
    const updatedInvoice = {
      ...currentInvoice,
      calculationSteps: currentInvoice.calculationSteps.map(step =>
        step.id === stepId ? {
          ...step,
          isIncorrect,
          // If marking as incorrect, ensure isVerified is false
          isVerified: isIncorrect ? false : step.isVerified
        } : step
      )
    };

    setCurrentInvoice(updatedInvoice)
  };

  // Handle adding comments to steps
  const handleAddComment = (stepId: string, comment: string) => {
    if (!currentInvoice || !selectedEmployee) {
      return
    }

    // Dispatch action to Redux
    dispatch(addStepComment({
      invoiceId: currentInvoice.id,
      stepId,
      comment,
      employeeId: selectedEmployee
    }));

    // Update the current invoice with new comment
    const updatedInvoice = {
      ...currentInvoice,
      calculationSteps: currentInvoice.calculationSteps.map(step =>
        step.id === stepId ? { ...step, comment } : step
      )
    };

    setCurrentInvoice(updatedInvoice)
  };

  // Handle invoice verification
  const handleVerifyInvoice = (isVerified: boolean) => {
    if (!currentInvoice || !selectedEmployee) {
      return
    }

    // Dispatch action to Redux
    dispatch(verifyInvoice({
      invoiceId: currentInvoice.id,
      isVerified,
      employeeId: selectedEmployee
    }));

    // Update the current invoice
    const updatedInvoice = {
      ...currentInvoice,
      isVerified
    };

    // Update the current invoice state
    setCurrentInvoice(updatedInvoice);

    // Trigger a re-render of the EmployeeList to update the status indicator
    setTimeout(() => {
      // Using setTimeout to ensure Redux state is updated before the re-render
      setSelectedEmployee(prevEmployee => {
        // Force React to see this as a state change by creating a new value
        // even though it's the same string
        return String(prevEmployee);
      });
    }, 50);
  };

  // Function to select a new random invoice for the currently selected employee
  const handleSelectNewInvoice = () => {
    if (!selectedEmployee) {
      return
    }

    // Get a random invoice for the employee from the current quarter only
    const invoice = getRandomInvoiceForEmployee(selectedEmployee, quarter, year);

    if (invoice) {
      const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData);
      setCurrentInvoice(updatedInvoice)
    } else {
      // Show a message if no invoices found for this employee in the current quarter
      alert(`No invoices found for this employee in ${currentQuarterFormatted}`)
    }
  };

  // Add event listener for the selectRandomInvoice custom event
  React.useEffect(() => {
    const handleSelectRandomInvoiceEvent = () => {
      handleSelectNewInvoice();
    };

    window.addEventListener('selectRandomInvoice', handleSelectRandomInvoiceEvent);

    return () => {
      window.removeEventListener('selectRandomInvoice', handleSelectRandomInvoiceEvent);
    };
  }, [selectedEmployee, quarter, year, verificationData, currentQuarterFormatted]);

  return (
    <div className="app">
      <Header />

      <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
         <VerificationStatus
          verifiedInvoicesCount={Object.keys(verificationData).length}
          currentQuarter={currentQuarterFormatted}
          employeesNeedingVerification={employeesNeedingVerification.length}
          totalEmployees={employees.length}
          key={Object.keys(verificationData).join(',')}
        />


        {activeTab === 'overview' ? (
          // Overview Tab - Show verified invoices table
          <>
            <VerifiedInvoicesTable
              onSelectInvoice={handleSelectInvoiceFromTable}
              employeeQuarterlyStatus={employeeQuarterlyStatus}
              currentQuarter={currentQuarterFormatted}
            />
            <PastQuarterVerificationsTable
              onSelectInvoice={handleSelectInvoiceFromTable}
              employeeQuarterlyStatus={employeeQuarterlyStatus}
            />
          </>
        ) : (
          // Verification Tab - Show verification interface
          <main className="container">
            <div style={{ display: 'flex', gap: '20px', flexDirection: 'row-reverse' }}>
              {/* Employee List (right side - 30% width) */}
              <div style={{ flex: '0 0 30%' }}>
                <EmployeeList
                  employees={employees}
                  selectedEmployee={selectedEmployee}
                  onSelectEmployee={handleSelectEmployee}
                  employeeQuarterlyStatus={employeeQuarterlyStatus}
                  currentQuarter={currentQuarterFormatted}
                />
              </div>

              {/* Invoice Details (left side - 70% width) */}
              <div style={{ flex: '1 1 70%' }}>
                {selectedEmployee ? (
                  <InvoiceDetails
                    invoice={currentInvoice}
                    onVerifyStep={handleVerifyStep}
                    onMarkStepIncorrect={handleMarkStepIncorrect}
                    onAddComment={handleAddComment}
                    onVerifyInvoice={handleVerifyInvoice}
                    currentQuarter={currentQuarterFormatted}
                  />
                ) : (
                  <div className="card">
                    <h2>Claim Information</h2>
                    <p>Select an employee from the right panel to begin verification.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
    </div>
  )
}

export default App
