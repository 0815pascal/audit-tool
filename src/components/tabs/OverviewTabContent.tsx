import React from 'react';
import VerifiedInvoicesTable from '../verified-invoices/VerifiedInvoicesTable';
import { PastQuarterVerificationsTable } from '../past-quarter-verifications';
import { useVerificationHandlers } from '../../hooks/useVerificationHandlers';
import { Card } from '../common';

const OverviewTabContent: React.FC = () => {
  const {
    handleSelectInvoiceFromTable: onSelectInvoice,
    employeeQuarterlyStatus,
    currentQuarterFormatted: currentQuarter
  } = useVerificationHandlers();

  return (
    <>
      <Card title="Verified Invoices" className="mb-4" fullWidth>
        <VerifiedInvoicesTable
          onSelectInvoice={onSelectInvoice}
          employeeQuarterlyStatus={employeeQuarterlyStatus}
          currentQuarter={currentQuarter}
          showTitle={false}
        />
      </Card>
      
      <Card title="Past Quarter Verifications" fullWidth>
        <PastQuarterVerificationsTable
          onSelectInvoice={onSelectInvoice}
          employeeQuarterlyStatus={employeeQuarterlyStatus}
          showTitle={false}
        />
      </Card>
    </>
  );
};

export default OverviewTabContent; 