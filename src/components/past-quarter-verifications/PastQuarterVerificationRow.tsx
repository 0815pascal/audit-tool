import React from 'react';
import { tableCellStyle, ProgressBarWithLabel } from '../common';
import { PastQuarterVerificationRowProps } from './types';

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
        <ProgressBarWithLabel
          percentage={verification.progressPercent}
          label={verification.progress}
          hasError={verification.hasIncorrectCalculations}
        />
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