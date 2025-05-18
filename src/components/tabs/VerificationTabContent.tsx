import React from 'react';
import EmployeeList from '../EmployeeList';
import { InvoiceDetails } from '../verification';
import EmptyClaimInfo from '../verification/EmptyClaimInfo';
import { useVerificationHandlers } from '../../hooks/useVerificationHandlers';

const VerificationTabContent: React.FC = () => {
  const {
    selectedEmployee,
    currentInvoice,
    employeeQuarterlyStatus,
    currentQuarterFormatted: currentQuarter,
    employeesNeedingVerification: employees,
    loading,
    handleSelectEmployee: onSelectEmployee,
    handleVerifyStep: onVerifyStep,
    handleMarkStepIncorrect: onMarkStepIncorrect,
    handleAddComment: onAddComment,
    handleVerifyInvoice: onVerifyInvoice
  } = useVerificationHandlers();

  return (
    <main className="container">
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'row-reverse' }}>
        {/* Employee List (right side - 30% width) */}
        <div style={{ flex: '0 0 30%' }}>
          <EmployeeList
            employees={employees}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={onSelectEmployee}
            employeeQuarterlyStatus={employeeQuarterlyStatus}
            currentQuarter={currentQuarter}
            loading={loading}
          />
        </div>

        {/* Invoice Details (left side - 70% width) */}
        <div style={{ flex: '1 1 70%' }}>
          {selectedEmployee ? (
            <InvoiceDetails
              invoice={currentInvoice}
              onVerifyStep={onVerifyStep}
              onMarkStepIncorrect={onMarkStepIncorrect}
              onAddComment={onAddComment}
              onVerifyInvoice={onVerifyInvoice}
              currentQuarter={currentQuarter}
            />
          ) : (
            <EmptyClaimInfo />
          )}
        </div>
      </div>
    </main>
  );
};

export default VerificationTabContent; 