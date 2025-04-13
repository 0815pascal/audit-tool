import React, { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectVerificationData, getCurrentQuarter } from '../store/verificationSlice';
import { invoices, employees } from '../mockData';

interface VerifiedInvoicesTableProps {
  onSelectInvoice?: (invoiceId: string) => void;
  employeeQuarterlyStatus: {
    [employeeId: string]: {
      [quarterKey: string]: {
        verified: boolean;
        lastVerified?: string;
      }
    }
  };
  currentQuarter: string;
}

const VerifiedInvoicesTable: React.FC<VerifiedInvoicesTableProps> = ({ 
  onSelectInvoice,
  employeeQuarterlyStatus,
  currentQuarter
}) => {
  const verificationData = useAppSelector(selectVerificationData);
  const { quarter: currentQuarterNum, year: currentYear } = getCurrentQuarter();
  
  // Get all verified invoices with their verification data for the current quarter only
  const verifiedInvoices = useMemo(() => {
    return Object.keys(verificationData)
      .filter(invoiceId => {
        const verification = verificationData[invoiceId];
        // Only include invoices from the current quarter that have verification data
        const isCurrentQuarter = verification.quarter === currentQuarterNum && verification.year === currentYear;
        return isCurrentQuarter && (verification.isVerified || 
          Object.values(verification.steps).some(step => step.isVerified || step.isIncorrect));
      })
      .map(invoiceId => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        const verification = verificationData[invoiceId];
        
        if (!invoice) return null;
        
        // Get employee name
        const employee = employees.find(emp => emp.id === invoice.employeeId) || 
                         { id: invoice.employeeId, name: 'Unknown Employee', department: '' };
        
        // Count verified steps and incorrect steps
        const totalSteps = invoice.calculationSteps.length;
        const verifiedSteps = Object.keys(verification.steps)
          .filter(stepId => verification.steps[stepId].isVerified)
          .length;
        const incorrectSteps = Object.keys(verification.steps)
          .filter(stepId => verification.steps[stepId].isIncorrect)
          .length;
        
        // Calculate the number of actively processed steps (verified or incorrect)
        const processedSteps = verifiedSteps + incorrectSteps;
        
        // Employee quarterly verification status
        const employeeId = invoice.employeeId;
        const quarterlyStatus = employeeQuarterlyStatus[employeeId]?.[currentQuarter] || { verified: false };
        
        return {
          id: invoice.id,
          employeeId: invoice.employeeId,
          employeeName: employee.name,
          date: invoice.date,
          clientName: invoice.clientName,
          policyNumber: invoice.policyNumber,
          caseNumber: invoice.caseNumber,
          dossierName: invoice.dossierName,
          totalAmount: invoice.totalAmount,
          isFullyVerified: verification.isVerified,
          hasIncorrectCalculations: incorrectSteps > 0,
          verificationDate: verification.verificationDate,
          progress: `${processedSteps}/${totalSteps}`,
          progressPercent: Math.round((processedSteps / totalSteps) * 100),
          quarterlyStatus,
        };
      })
      .filter(Boolean) as {
        id: string;
        employeeId: string;
        employeeName: string;
        date: string;
        clientName: string;
        policyNumber: string;
        caseNumber: number;
        dossierName: string;
        totalAmount: number;
        isFullyVerified: boolean;
        hasIncorrectCalculations: boolean;
        verificationDate: string | null;
        progress: string;
        progressPercent: number;
        quarterlyStatus: { verified: boolean };
      }[];
  }, [verificationData, employeeQuarterlyStatus, currentQuarter, currentQuarterNum, currentYear]);
  
  if (verifiedInvoices.length === 0) {
    return (
      <div className="mb-8 left">
        <h2>Verified Invoices</h2>
        <p>No invoices have been verified yet.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-4">
      <h2>Verified Invoices</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          textAlign: 'left'
        }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
              <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Case #</th>
              <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Client</th>
              <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Policy #</th>
              <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Dossier</th>
              <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Employee</th>
              <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Amount</th>
              <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Progress</th>
              <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Date</th>
            </tr>
          </thead>
          <tbody>
            {verifiedInvoices.map(invoice => (
              <tr 
                key={invoice.id}
                style={{ 
                  cursor: onSelectInvoice ? 'pointer' : 'default',
                }}
                onClick={() => onSelectInvoice && onSelectInvoice(invoice.id)}
              >
                <td style={tableCellStyle} align="left">{invoice.caseNumber}</td>
                <td style={tableCellStyle} align="left">{invoice.clientName}</td>
                <td style={tableCellStyle} align="left">{invoice.policyNumber}</td>
                <td style={tableCellStyle} align="left">{invoice.dossierName}</td>
                <td style={tableCellStyle} align="left">{invoice.employeeName}</td>
                <td style={tableCellStyle} align="left">${invoice.totalAmount.toFixed(2)}</td>
                <td style={tableCellStyle}>
                  <div style={{ position: 'relative', height: '20px', width: '100%', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    <div 
                      style={{ 
                        position: 'absolute', 
                        height: '100%', 
                        width: `${invoice.progressPercent}%`, 
                        backgroundColor: invoice.hasIncorrectCalculations ? '#d32f2f' : 'var(--primary-color)',
                        borderRadius: '4px'
                      }} 
                    />
                    <div 
                      style={{ 
                        position: 'absolute', 
                        width: '100%', 
                        textAlign: 'start', 
                        paddingLeft: '5px',
                        color: invoice.progressPercent > 50 ? 'white' : 'var(--text-color)',
                        lineHeight: '20px',
                        fontSize: '0.8rem'
                      }}
                    >
                      {invoice.progress}
                    </div>
                  </div>
                </td>
                <td style={tableCellStyle} align="left">{invoice.verificationDate 
                  ? new Date(invoice.verificationDate).toLocaleDateString() 
                  : 'In progress'
                }</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left',
  verticalAlign: 'top',
  fontWeight: 'bold',
  borderBottom: '2px solid var(--border-color)'
};

const tableCellStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left !important' as any,
  verticalAlign: 'top',
  borderBottom: '1px solid var(--border-color)'
};

export default VerifiedInvoicesTable; 