import React from 'react';

interface ProgressBarProps {
  percentage: number;
  height?: number;
  successColor?: string;
  inProgressColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  height = 8,
  successColor = '#4caf50',
  inProgressColor = '#ffbc11'
}) => {
  return (
    <div 
      style={{ 
        position: 'relative', 
        height: `${height}px`, 
        backgroundColor: '#f0f0f0', 
        borderRadius: '4px',
        marginBottom: '1.5rem' 
      }}
    >
      <div
        style={{
          position: 'absolute',
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: percentage < 100 ? inProgressColor : successColor,
          borderRadius: '4px',
          transition: 'width 0.5s ease-in-out'
        }}
      />
    </div>
  );
};

export default ProgressBar; 