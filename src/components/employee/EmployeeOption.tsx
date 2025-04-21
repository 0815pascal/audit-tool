import React from 'react';
import { Employee } from '../../types';

// Possible verification status types
export type VerificationStatus = 'verified' | 'verified-with-errors' | 'in-progress' | 'unverified';

interface EmployeeOptionProps {
  employee: Employee;
  status: VerificationStatus;
}

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

const EmployeeOption: React.FC<EmployeeOptionProps> = ({
  employee,
  status
}) => {
  return (
    <option
      value={employee.id}
      style={getOptionStyle(status)}
    >
      {getStatusIcon(status)}{employee.name}
    </option>
  );
};

export default EmployeeOption; 