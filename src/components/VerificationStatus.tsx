import React from 'react';

interface VerificationStatusProps {
  verifiedInvoicesCount: number;
  currentQuarter: string;
  employeesNeedingVerification: number;
  totalEmployees: number;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({ 
  currentQuarter,
  employeesNeedingVerification,
  totalEmployees
}) => {
  const completionPercentage = Math.round(((totalEmployees - employeesNeedingVerification) / totalEmployees) * 100);
  
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
          </div>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold'}}>
              {completionPercentage}%
            </div>
            <div style={{ fontSize: '0.8rem' }}>
              Complete
            </div>
          </div>
        </div>
        
        <div style={{ position: 'relative', height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '1.5rem' }}>
          <div 
            style={{ 
              position: 'absolute', 
              height: '100%', 
              width: `${completionPercentage}%`, 
              backgroundColor: completionPercentage < 100 ? '#ffbc11' : '#4caf50',
              borderRadius: '4px',
              transition: 'width 0.5s ease-in-out'
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default VerificationStatus; 