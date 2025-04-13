import React from 'react';

interface VerificationStatusProps {
  verifiedInvoicesCount: number;
  currentQuarter: string;
  employeesNeedingVerification: number;
  totalEmployees: number;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({ 
  verifiedInvoicesCount,
  currentQuarter,
  employeesNeedingVerification,
  totalEmployees
}) => {
  const completionPercentage = Math.round(((totalEmployees - employeesNeedingVerification) / totalEmployees) * 100);
  
  return (
    <div className="card mb-4">
      <h2>Verification Status</h2>
      <div style={{ marginTop: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem' 
        }}>
          <div>
            <h3 style={{ margin: 0 }}>{currentQuarter} Quarterly Verification</h3>
            <p style={{ margin: '0.5rem 0 0 0' }}>
              {employeesNeedingVerification > 0 ? (
                <span style={{ color: '#f57c00' }}>
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
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: employeesNeedingVerification > 0 ? '#f57c00' : '#4caf50' }}>
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
              backgroundColor: completionPercentage < 100 ? '#f57c00' : '#4caf50',
              borderRadius: '4px',
              transition: 'width 0.5s ease-in-out'
            }} 
          />
        </div>
        
        <p>
          {verifiedInvoicesCount > 0 ? (
            <>
              <strong>{verifiedInvoicesCount}</strong> invoice(s) have verification data.
              Data is stored in your browser using Redux state.
            </>
          ) : (
            <>
              No invoices have been verified yet. 
              Start by selecting an employee and verifying invoice steps.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default VerificationStatus; 