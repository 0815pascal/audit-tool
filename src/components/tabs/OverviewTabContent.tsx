import React from 'react';
import VerifiedInvoicesTable from '../VerifiedInvoicesTable';
import PastQuarterVerificationsTable from '../PastQuarterVerificationsTable';
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