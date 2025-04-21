import React from 'react';
import { StatusMessage, CompletionIndicator, ProgressBar } from './status';
import { useVerificationHandlers } from '../hooks/useVerificationHandlers';

const VerificationStatus: React.FC = () => {
  const {
    currentQuarterFormatted: currentQuarter,
    employeesNeedingVerification,
    totalEmployees
    } = useVerificationHandlers();

  const completionPercentage = Math.round(((totalEmployees - employeesNeedingVerification.length) / totalEmployees) * 100);

  return (
    <div className="mb-4">
      <div style={{ marginTop: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h3 style={{ margin: 0, textAlign: 'start' }}>{currentQuarter} Quarterly Verification</h3>
            <StatusMessage 
              employeesNeedingVerification={employeesNeedingVerification.length}
            />
          </div>
          <CompletionIndicator completionPercentage={completionPercentage} />
        </div>

        <ProgressBar percentage={completionPercentage} />
      </div>
    </div>
  );
};

export default VerificationStatus;
