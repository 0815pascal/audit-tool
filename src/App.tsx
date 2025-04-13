import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import EmployeeList from './components/EmployeeList'
import InvoiceDetails from './components/InvoiceDetails'
import VerificationStatus from './components/VerificationStatus.tsx'
import TabNavigation, { TabView } from './components/TabNavigation'
import VerifiedInvoicesTable from './components/VerifiedInvoicesTable'
import { employees, getRandomInvoiceForEmployee, invoices } from './mockData'
import { Invoice } from './types'
import { useAppSelector, useAppDispatch } from './store/hooks'
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
  const [activeTab, setActiveTab] = useState<TabView>('verification')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  
  // Get verification data from Redux store
  const verificationData = useAppSelector(selectVerificationData)
  const employeeQuarterlyStatus = useAppSelector(selectEmployeeQuarterlyStatus)
  const employeesNeedingVerification = useAppSelector(state => 
    selectEmployeesNeedingVerification(state, employees)
  )
  const { quarter, year } = getCurrentQuarter()
  const currentQuarterFormatted = formatQuarterYear(quarter, year)
  const dispatch = useAppDispatch()
  
  // Initialize state when the component mounts
  useEffect(() => {
    dispatch(initializeState());
  }, [dispatch]);
  
  // Handle tab change
  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab)
  }
  
  // Handle selecting an invoice from the table
  const handleSelectInvoiceFromTable = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (invoice) {
      // Find the employee for this invoice
      setSelectedEmployee(invoice.employeeId)
      
      // Apply verification data
      const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData)
      setCurrentInvoice(updatedInvoice)
      
      // Switch to verification tab
      setActiveTab('verification')
    }
  }
  
  // Handle employee selection
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployee(employeeId)
    if (employeeId) {
      // Get a random invoice for the employee
      const invoice = getRandomInvoiceForEmployee(employeeId)
      
      // If we have an invoice, apply any existing verification data to it
      if (invoice) {
        const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData)
        setCurrentInvoice(updatedInvoice)
      } else {
        setCurrentInvoice(null)
      }
    } else {
      setCurrentInvoice(null)
    }
  }
  
  // Handle step verification
  const handleVerifyStep = (stepId: string, isVerified: boolean) => {
    if (!currentInvoice || !selectedEmployee) return
    
    // Dispatch action to Redux
    dispatch(verifyStep({ 
      invoiceId: currentInvoice.id, 
      stepId, 
      isVerified,
      employeeId: selectedEmployee
    }))
    
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
    }
    
    setCurrentInvoice(updatedInvoice)
  }
  
  // Handle marking step as incorrect
  const handleMarkStepIncorrect = (stepId: string, isIncorrect: boolean) => {
    if (!currentInvoice || !selectedEmployee) return
    
    // Dispatch action to Redux
    dispatch(markStepIncorrect({ 
      invoiceId: currentInvoice.id, 
      stepId, 
      isIncorrect,
      employeeId: selectedEmployee
    }))
    
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
    }
    
    setCurrentInvoice(updatedInvoice)
  }
  
  // Handle adding comments to steps
  const handleAddComment = (stepId: string, comment: string) => {
    if (!currentInvoice || !selectedEmployee) return
    
    // Dispatch action to Redux
    dispatch(addStepComment({ 
      invoiceId: currentInvoice.id, 
      stepId, 
      comment,
      employeeId: selectedEmployee
    }))
    
    // Update the current invoice with new comment
    const updatedInvoice = {
      ...currentInvoice,
      calculationSteps: currentInvoice.calculationSteps.map(step => 
        step.id === stepId ? { ...step, comment } : step
      )
    }
    
    setCurrentInvoice(updatedInvoice)
  }
  
  // Handle invoice verification
  const handleVerifyInvoice = (isVerified: boolean) => {
    if (!currentInvoice || !selectedEmployee) return
    
    // Check if any steps are marked as incorrect - invoice can't be verified if there are incorrect steps
    const hasIncorrectSteps = currentInvoice.calculationSteps.some(step => step.isIncorrect)
    if (isVerified && hasIncorrectSteps) return
    
    // Dispatch action to Redux
    dispatch(verifyInvoice({ 
      invoiceId: currentInvoice.id, 
      isVerified,
      employeeId: selectedEmployee
    }))
    
    // Update the current invoice
    const updatedInvoice = {
      ...currentInvoice,
      isVerified
    }
    
    setCurrentInvoice(updatedInvoice)
  }
  
  // Select a new random invoice for the current employee
  const handleSelectNewInvoice = () => {
    if (selectedEmployee) {
      const invoice = getRandomInvoiceForEmployee(selectedEmployee)
      if (invoice) {
        const updatedInvoice = applyVerificationDataToInvoice(invoice, verificationData)
        setCurrentInvoice(updatedInvoice)
      }
    }
  }

  return (
    <div className="app">
      <Header />
      
      <main className="container">
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        <VerificationStatus 
          verifiedInvoicesCount={Object.keys(verificationData).length}
          currentQuarter={currentQuarterFormatted}
          employeesNeedingVerification={employeesNeedingVerification.length}
          totalEmployees={employees.length}
        />
        
        {activeTab === 'overview' ? (
          // Overview Tab - Show verified invoices table
          <VerifiedInvoicesTable 
            onSelectInvoice={handleSelectInvoiceFromTable}
            employeeQuarterlyStatus={employeeQuarterlyStatus}
            currentQuarter={currentQuarterFormatted}
          />
        ) : (
          // Verification Tab - Show verification interface
          <>
            <div className="mb-4">
              <EmployeeList 
                employees={employees}
                selectedEmployee={selectedEmployee}
                onSelectEmployee={handleSelectEmployee}
                employeeQuarterlyStatus={employeeQuarterlyStatus}
                currentQuarter={currentQuarterFormatted}
              />
            </div>
            
            {selectedEmployee && (
              <div className="mb-4">
                <InvoiceDetails 
                  invoice={currentInvoice}
                  onVerifyStep={handleVerifyStep}
                  onMarkStepIncorrect={handleMarkStepIncorrect}
                  onAddComment={handleAddComment}
                  onVerifyInvoice={handleVerifyInvoice}
                />
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button onClick={handleSelectNewInvoice}>Select Another Random Invoice</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
