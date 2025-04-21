import React from 'react';
import { Employee } from '../types';
import { Card } from './common';
import { EmployeeOption, StatusLegend, useEmployeeStatus } from './employee';

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

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  selectedEmployee,
  onSelectEmployee,
  employeeQuarterlyStatus,
  currentQuarter
}) => {
  const { getVerificationStatus } = useEmployeeStatus(employeeQuarterlyStatus);

  if (employees.length === 0) {
    return (
      <Card title="Employee Selector">
        <p>No employees found in this department.</p>
      </Card>
    );
  }

  // Style for the select element to make it more prominent
  const selectStyle: React.CSSProperties = {
    padding: '10px',
    width: '100%',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    marginTop: '8px'
  };

  return (
    <Card title="Claim Manager" centerTitle>
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
              <EmployeeOption 
                key={employee.id}
                employee={employee}
                status={status}
              />
            );
          })}
        </select>
        <StatusLegend />
      </div>
    </Card>
  );
};

export default EmployeeList;
