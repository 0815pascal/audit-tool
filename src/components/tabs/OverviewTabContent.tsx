import React from 'react';
import VerifiedInvoicesTable from '../verified-invoices/VerifiedInvoicesTable';
import { PastQuarterVerificationsTable } from '../past-quarter-verifications';
import { useVerificationHandlers } from '../../hooks/useVerificationHandlers';

const OverviewTabContent: React.FC = () => {
  const {
    handleSelectInvoiceFromTable: onSelectInvoice,
    employeeQuarterlyStatus,
    currentQuarterFormatted: currentQuarter
  } = useVerificationHandlers();

  return (
    <>
      <VerifiedInvoicesTable
        onSelectInvoice={onSelectInvoice}
        employeeQuarterlyStatus={employeeQuarterlyStatus}
        currentQuarter={currentQuarter}
      />
      <PastQuarterVerificationsTable
        onSelectInvoice={onSelectInvoice}
        employeeQuarterlyStatus={employeeQuarterlyStatus}
      />
    </>
  );
};

export default OverviewTabContent; 