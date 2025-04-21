import React from 'react';
import { useVerifiedInvoices } from '../hooks/useVerifiedInvoices';
import {
  EmptyState,
  VerifiedInvoicesTableHeader,
  VerifiedInvoiceRow,
  VerifiedInvoicesTableProps
} from './verified-invoices';

const VerifiedInvoicesTable: React.FC<VerifiedInvoicesTableProps> = ({
  onSelectInvoice,
  employeeQuarterlyStatus,
  currentQuarter
}) => {
  const verifiedInvoices = useVerifiedInvoices(employeeQuarterlyStatus, currentQuarter);

  if (verifiedInvoices.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="mb-8 left">
      <h2>Verified Invoices</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left'
        }}>
          <VerifiedInvoicesTableHeader />
          <tbody>
            {verifiedInvoices.map(invoice => (
              <VerifiedInvoiceRow
                key={invoice.id}
                invoice={invoice}
                onSelect={() => onSelectInvoice && onSelectInvoice(invoice.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VerifiedInvoicesTable;
