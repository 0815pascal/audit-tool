import React from 'react';
import VerifiedInvoicesTable from '../VerifiedInvoicesTable';
import PastQuarterVerificationsTable from '../PastQuarterVerificationsTable';

interface OverviewTabContentProps {
  onSelectInvoice: (invoiceId: string) => void;
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

const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  onSelectInvoice,
  employeeQuarterlyStatus,
  currentQuarter
}) => {
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