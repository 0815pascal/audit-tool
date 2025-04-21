import React from 'react';
import { useVerifiedInvoices } from '../../hooks/useVerifiedInvoices';
import {
  EmptyState,
  VerifiedInvoicesTableHeader,
  VerifiedInvoiceRow,
  VerifiedInvoicesTableProps
} from '.';
import { DataTable } from '../common';

const VerifiedInvoicesTable: React.FC<VerifiedInvoicesTableProps> = ({
  onSelectInvoice,
  employeeQuarterlyStatus,
  currentQuarter
}) => {
  const verifiedInvoices = useVerifiedInvoices(employeeQuarterlyStatus, currentQuarter);

  return (
    <DataTable
      title="Verified Invoices"
      emptyState={<EmptyState />}
      tableHeader={<VerifiedInvoicesTableHeader />}
      data={verifiedInvoices}
      className="mb-8"
      renderRow={(invoice) => (
        <VerifiedInvoiceRow
          key={invoice.id}
          invoice={invoice}
          onSelect={() => onSelectInvoice && onSelectInvoice(invoice.id)}
        />
      )}
    />
  );
};

export default VerifiedInvoicesTable;
