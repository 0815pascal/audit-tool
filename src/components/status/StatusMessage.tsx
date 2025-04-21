import React from 'react';

interface StatusMessageProps {
  employeesNeedingVerification: number;
}

const StatusMessage: React.FC<StatusMessageProps> = ({
  employeesNeedingVerification
}) => {
  return (
    <p style={{ margin: '0.5rem 0 0 0' }}>
      {employeesNeedingVerification > 0 ? (
        <span style={{ color: 'var(--info-color)' }}>
          <strong>{employeesNeedingVerification}</strong> employee(s) still need verification this quarter
        </span>
      ) : (
        <span style={{ color: '#4caf50' }}>
          All employees verified for this quarter!
        </span>
      )}
    </p>
  );
};

export default StatusMessage; 