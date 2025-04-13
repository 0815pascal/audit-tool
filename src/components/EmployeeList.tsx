import React from 'react';
import { Employee } from '../types';
import { department } from '../mockData';
import { useAppSelector } from '../store/hooks';
import { selectVerificationData } from '../store/verificationSlice';

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
        <h2>{department.name} Employees</h2>
        <p>No employees found in this department.</p>
      </div>
    );
  }

  // Helper function to get verification status indicator
  const getVerificationStatus = (employeeId: string): VerificationStatus => {
    const status = employeeQuarterlyStatus[employeeId]?.[currentQuarter];
    
    // If verified in the current quarter
    if (status?.verified) {
      // Check if any of the employee's verified invoices have errors
      const employeeInvoices = Object.values(verificationData).filter(
        invoice => invoice.employeeId === employeeId && invoice.isVerified
      );
      
      // Check if any verified invoices have incorrect calculations
      const hasErrors = employeeInvoices.some(invoice => {
        return Object.values(invoice.steps).some(step => step.isIncorrect);
      });
      
      return hasErrors ? 'verified-with-errors' : 'verified';
    }
    
    // Check if there's any in-progress verification for this employee
    const hasInProgress = Object.values(verificationData).some(
      invoice => 
        invoice.employeeId === employeeId && 
        !invoice.isVerified && 
        Object.values(invoice.steps).some(step => step.isVerified || step.isIncorrect)
    );
    
    return hasInProgress ? 'in-progress' : 'unverified';
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

  // Count verified employees (including those with errors)
  const verifiedCount = employees.filter(emp => {
    const status = getVerificationStatus(emp.id);
    return status === 'verified' || status === 'verified-with-errors';
  }).length;

  return (
    <div className="card">
      <h2>{department.name} Employees</h2>
      <div className="form-group">
        <label htmlFor="employee-select">Select Employee for Audit</label>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '5px' }}>
          🟢 = Verified &nbsp;|&nbsp; 🟡 = Verified with errors &nbsp;|&nbsp; ⏳ = In progress &nbsp;|&nbsp; 🔴 = Not verified
        </p>
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
      </div>
      
      <div className="mt-4">
        <h3>Quarterly Verification Summary</h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          <div>
            <strong>{currentQuarter}</strong>
          </div>
          <div>
            <span style={{ color: '#00c853', fontWeight: 'bold' }}>
              {verifiedCount}
            </span>
            &nbsp;/&nbsp;
            <span>{employees.length}</span>
            &nbsp;verified
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList; 