import React from 'react';
import ProgressBar from '../status/ProgressBar';

interface ProgressBarWithLabelProps {
  percentage: number;
  label: string;
  hasError?: boolean;
  height?: number;
}

export const ProgressBarWithLabel: React.FC<ProgressBarWithLabelProps> = ({
  percentage,
  label,
  hasError = false,
  height = 20
}) => {
  return (
    <div style={{ position: 'relative', height: `${height}px` }}>
      <ProgressBar 
        percentage={percentage}
        height={height}
        successColor={hasError ? '#d32f2f' : 'var(--primary-color)'}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          width: '100%',
          textAlign: 'center',
          color: percentage > 50 ? 'white' : 'var(--text-color)',
          lineHeight: `${height}px`,
          fontSize: '0.8rem'
        }}
      >
        {label}
      </div>
    </div>
  );
}; 