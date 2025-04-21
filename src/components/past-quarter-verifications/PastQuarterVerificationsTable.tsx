import React from 'react';
import { usePastQuarterVerifications } from '../../hooks/usePastQuarterVerifications';
import { PastQuarterVerificationsTableProps } from './types';
import { EmptyState } from './EmptyState';
import { PastQuarterVerificationsTableHeader } from './PastQuarterVerificationsTableHeader';
import { PastQuarterVerificationRow } from './PastQuarterVerificationRow';
import { DataTable } from '../common';

export const PastQuarterVerificationsTable: React.FC<PastQuarterVerificationsTableProps> = ({
  onSelectInvoice,
  employeeQuarterlyStatus
}) => {
  const pastQuarterVerifications = usePastQuarterVerifications(employeeQuarterlyStatus);

  return (
    <DataTable
      title="Past Quarter Verifications"
      emptyState={<EmptyState />}
      tableHeader={<PastQuarterVerificationsTableHeader />}
      data={pastQuarterVerifications}
      useClassNameStyling={true}
      renderRow={(verification) => (
        <PastQuarterVerificationRow
          key={verification.id}
          verification={verification}
          onSelect={onSelectInvoice ? () => onSelectInvoice(verification.id) : undefined}
        />
      )}
    />
  );
}; 