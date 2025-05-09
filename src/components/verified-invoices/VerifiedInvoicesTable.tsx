import React from 'react';
import { useVerifiedInvoices } from '../../hooks/useVerifiedInvoices';
import {
  EmptyState,
  VerifiedInvoicesTableHeader,
  VerifiedInvoiceRow,
  VerifiedInvoicesTableProps,
  VerifiedInvoice
} from '.';
import { DataTable } from '../common';

const VerifiedInvoicesTable: React.FC<VerifiedInvoicesTableProps> = ({
  onSelectInvoice,
  employeeQuarterlyStatus,
  currentQuarter,
  showTitle = true
}) => {
  const verifiedInvoices = useVerifiedInvoices(employeeQuarterlyStatus, currentQuarter);

  return (
    <DataTable<VerifiedInvoice>
      title="Verified Invoices"
      emptyState={<EmptyState insideCard={!showTitle} />}
      tableHeader={<VerifiedInvoicesTableHeader />}
      data={verifiedInvoices}
      className={showTitle ? "mb-8" : ""}
      showTitle={showTitle}
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
