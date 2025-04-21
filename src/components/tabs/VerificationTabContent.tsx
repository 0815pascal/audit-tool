import React from 'react';
import EmployeeList from '../EmployeeList';
import { InvoiceDetails } from '../verification';
import EmptyClaimInfo from '../verification/EmptyClaimInfo';
import { Employee, Invoice } from '../../types';

interface VerificationTabContentProps {
  employees: Employee[];
  selectedEmployee: string;
  currentInvoice: Invoice | null;
  employeeQuarterlyStatus: {
    [employeeId: string]: {
      [quarterKey: string]: {
        verified: boolean;
        lastVerified?: string;
      }
    }
  };
  currentQuarter: string;
  onSelectEmployee: (employeeId: string) => void;
  onVerifyStep: (stepId: string, verified: boolean) => void;
  onMarkStepIncorrect: (stepId: string, incorrect: boolean) => void;
  onAddComment: (stepId: string, comment: string) => void;
  onVerifyInvoice: (verified: boolean) => void;
}

const VerificationTabContent: React.FC<VerificationTabContentProps> = ({
  employees,
  selectedEmployee,
  currentInvoice,
  employeeQuarterlyStatus,
  currentQuarter,
  onSelectEmployee,
  onVerifyStep,
  onMarkStepIncorrect,
  onAddComment,
  onVerifyInvoice
}) => {
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