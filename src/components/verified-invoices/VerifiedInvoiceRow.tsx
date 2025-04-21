import React from 'react';
import { tableCellStyle, ProgressBarWithLabel } from '../common';
import { VerifiedInvoiceRowProps } from './types';

export const VerifiedInvoiceRow: React.FC<VerifiedInvoiceRowProps> = ({ invoice, onSelect }) => {
  return (
    <tr
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={onSelect}
    >
      <td style={tableCellStyle} align="left">Q2 2025</td>
      <td style={tableCellStyle} align="left">{invoice.caseNumber}</td>
      <td style={tableCellStyle} align="left">{invoice.clientName}</td>
      <td style={tableCellStyle} align="left">{invoice.policyNumber}</td>
      <td style={tableCellStyle} align="left">{invoice.dossierName}</td>
      <td style={tableCellStyle} align="left">{invoice.employeeName}</td>
      <td style={tableCellStyle} align="left">${invoice.totalAmount.toFixed(2)}</td>
      <td style={tableCellStyle}>
        <ProgressBarWithLabel
          percentage={invoice.progressPercent}
          label={invoice.progress}
          hasError={invoice.hasIncorrectCalculations}
        />
      </td>
      <td style={tableCellStyle} align="left">
        {invoice.verificationDate
          ? new Date(invoice.verificationDate).toLocaleDateString()
          : 'In progress'
        }
      </td>
    </tr>
  );
}; 