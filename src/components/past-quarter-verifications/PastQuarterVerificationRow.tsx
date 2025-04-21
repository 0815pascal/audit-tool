import React from 'react';
import { tableCellStyle } from './styles';
import { PastQuarterVerificationRowProps } from './types';
import ProgressBar from '../status/ProgressBar';

export const PastQuarterVerificationRow: React.FC<PastQuarterVerificationRowProps> = ({ 
  verification, 
  onSelect 
}) => {
  return (
    <tr
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={onSelect}
    >
      <td style={tableCellStyle}>{verification.quarter}</td>
      <td style={tableCellStyle}>{verification.caseNumber}</td>
      <td style={tableCellStyle}>{verification.clientName}</td>
      <td style={tableCellStyle}>{verification.policyNumber}</td>
      <td style={tableCellStyle}>{verification.dossierName}</td>
      <td style={tableCellStyle}>{verification.employeeName}</td>
      <td style={tableCellStyle}>${verification.totalAmount.toFixed(2)}</td>
      <td style={tableCellStyle}>
        <div style={{ position: 'relative', height: '20px' }}>
          <ProgressBar 
            percentage={verification.progressPercent} 
            height={20}
            successColor={verification.hasIncorrectCalculations ? '#d32f2f' : 'var(--primary-color)'}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: '100%',
              textAlign: 'center',
              color: verification.progressPercent > 50 ? 'white' : 'var(--text-color)',
              lineHeight: '20px',
              fontSize: '0.8rem'
            }}
          >
            {verification.progress}
          </div>
        </div>
      </td>
      <td style={tableCellStyle}>
        {verification.verificationDate
          ? new Date(verification.verificationDate).toLocaleDateString()
          : 'In progress'
        }
      </td>
    </tr>
  );
}; 