import React from 'react';

interface CompletionIndicatorProps {
  completionPercentage: number;
}

const CompletionIndicator: React.FC<CompletionIndicatorProps> = ({
  completionPercentage
}) => {
  return (
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
  );
};

export default CompletionIndicator; 