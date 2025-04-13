import React from 'react';
import { Employee } from '../types';
import { department } from '../mockData';

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
  if (employees.length === 0) {
    return (
      <div className="card">
        <h2>{department.name} Employees</h2>
        <p>No employees found in this department.</p>
      </div>
    );
  }

  // Helper function to get verification status badge
  const getVerificationBadge = (employeeId: string) => {
    const status = employeeQuarterlyStatus[employeeId]?.[currentQuarter];
    
    if (status?.verified) {
      return <span className="badge badge-success">✓ Verified</span>;
    } else {
      return <span className="badge badge-warning">⚠ Needs Verification</span>;
    }
  };

  return (
    <div className="card">
      <h2>{department.name} Employees</h2>
      <div className="form-group">
        <label htmlFor="employee-select">Select Employee for Audit</label>
        <select
          id="employee-select"
          value={selectedEmployee}
          onChange={(e) => onSelectEmployee(e.target.value)}
        >
          <option value="">-- Select an employee --</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="employee-list mt-3">
        <h3>Quarterly Verification Status</h3>
        <ul className="list-group">
          {employees.map((employee) => (
            <li 
              key={employee.id} 
              className={`list-group-item d-flex justify-content-between align-items-center ${selectedEmployee === employee.id ? 'active' : ''}`}
              onClick={() => onSelectEmployee(employee.id)}
              style={{ cursor: 'pointer' }}
            >
              <span>{employee.name}</span>
              {getVerificationBadge(employee.id)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EmployeeList; 