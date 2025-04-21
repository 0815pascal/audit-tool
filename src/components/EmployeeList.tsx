import React from 'react';
import { Employee } from '../types';
import { useAppSelector } from '../store/hooks';
import { selectVerificationData, getCurrentQuarter, formatQuarterYear } from '../store/verificationSlice';

interface EmployeeListProps {
  employees: Employee[];
  selectedEmployee: string;
  onSelectEmployee: (employeeId: string) => void;
  employeeQuarterlyStatus: {
    [employeeId: string]: {
      [quarterKey: string]: {
        verified: boolean;
        lastVerified?: string;
      }
    }
  };
  currentQuarter: string;
}

// Possible verification status types
type VerificationStatus = 'verified' | 'verified-with-errors' | 'in-progress' | 'unverified';

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  selectedEmployee,
  onSelectEmployee,
  employeeQuarterlyStatus,
  currentQuarter
}) => {
  const verificationData = useAppSelector(selectVerificationData);

  if (employees.length === 0) {
    return (
      <div className="card">
        <h2>Employee Selector</h2>
        <p>No employees found in this department.</p>
      </div>
    );
  }

  // Helper function to get verification status indicator
  const getVerificationStatus = (employeeId: string): VerificationStatus => {
    // Get the current quarter and year
    const { quarter: currentQuarterNum, year: currentYear } = getCurrentQuarter();
    const quarterKey = formatQuarterYear(currentQuarterNum, currentYear);

    // Check if the employee has a verified status in the quarterly status tracker
    const employeeStatus = employeeQuarterlyStatus[employeeId];
    const isVerifiedInQuarterlyStatus = employeeStatus && 
                                       employeeStatus[quarterKey] && 
                                       employeeStatus[quarterKey].verified;

    // If already marked verified in quarterly status, determine if there are errors
    if (isVerifiedInQuarterlyStatus) {
      // Filter invoices to only include those from the current employee AND current quarter
      const employeeInvoices = Object.entries(verificationData)
        .map(([id, data]) => ({
          id,
          ...data
        }))
        .filter(invoice =>
          invoice.employeeId === employeeId &&
          invoice.quarter === currentQuarterNum &&
          invoice.year === currentYear
        );

      // Check if any verified invoices have incorrect calculations
      const hasErrors = employeeInvoices.some(invoice => {
        return Object.values(invoice.steps).some(step => step.isIncorrect);
      });

      return hasErrors ? 'verified-with-errors' : 'verified';
    }

    // Filter invoices to only include those from the current employee AND current quarter
    const employeeInvoices = Object.entries(verificationData)
      .map(([id, data]) => ({
        id,
        ...data
      }))
      .filter(invoice =>
        invoice.employeeId === employeeId &&
        invoice.quarter === currentQuarterNum &&
        invoice.year === currentYear
      );

    // If no invoices are found for this employee in the current quarter, they are unverified
    if (employeeInvoices.length === 0) {
      return 'unverified';
    }

    // Check if there are any steps actively verified or marked incorrect in current quarter
    const hasAnyActiveSteps = employeeInvoices.some(invoice =>
      Object.values(invoice.steps).some(step => step.isVerified || step.isIncorrect)
    );

    // If no steps are actively processed at all, the status is unverified
    if (!hasAnyActiveSteps) {
      return 'unverified';
    }

    // At this point, we know the employee has some progress but isn't fully verified
    return 'in-progress';
  };

  // Style for the select element to make it more prominent
  const selectStyle: React.CSSProperties = {
    padding: '10px',
    width: '100%',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    marginTop: '8px'
  };

  // Style for the option elements
  const getOptionStyle = (status: VerificationStatus): React.CSSProperties => {
    let backgroundColor;

    switch (status) {
      case 'verified':
        backgroundColor = 'rgba(0, 200, 83, 0.1)'; // Green background
        break;
      case 'verified-with-errors':
        backgroundColor = 'rgba(255, 193, 7, 0.1)'; // Yellow background
        break;
      case 'in-progress':
        backgroundColor = 'rgba(33, 150, 243, 0.1)'; // Blue background
        break;
      default:
        backgroundColor = 'rgba(211, 47, 47, 0.1)'; // Red background
    }

    return {
      padding: '8px',
      backgroundColor
    };
  };

  // Get status icon
  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return '🟢 '; // Green circle
      case 'verified-with-errors':
        return '🟡 '; // Yellow circle
      case 'in-progress':
        return '⏳ '; // Hourglass
      default:
        return '🔴 '; // Red circle
    }
  };

  return (
    <div className="card" style={{ minWidth: '20rem' }}>
      <h2>Claim Manager</h2>
      <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
        Select a claim manager to review their calculations for {currentQuarter}
      </p>
      <div className="form-group">
        <select
          id="employee-select"
          value={selectedEmployee}
          onChange={(e) => onSelectEmployee(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- Select an employee --</option>
          {employees.map((employee) => {
            const status = getVerificationStatus(employee.id);
            return (
              <option
                key={employee.id}
                value={employee.id}
                style={getOptionStyle(status)}
              >
                {getStatusIcon(status)}{employee.name}
              </option>
            );
          })}
        </select>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '5px', textAlign: 'left', paddingLeft: '1.1rem' }}>
          🟢 = Verified &nbsp;<br/>  🟡 = Verified with errors &nbsp;<br/> 🔴 = Not verified &nbsp;<br/> ⏳ = In progress
        </p>
      </div>
    </div>
  );
};

export default EmployeeList;
