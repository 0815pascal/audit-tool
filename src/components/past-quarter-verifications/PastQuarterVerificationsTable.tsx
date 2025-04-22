import React from 'react';
import { usePastQuarterVerifications } from '../../hooks/usePastQuarterVerifications';
import { PastQuarterVerificationsTableProps } from './types';
import { EmptyState } from './EmptyState';
import { PastQuarterVerificationsTableHeader } from './PastQuarterVerificationsTableHeader';
import { PastQuarterVerificationRow } from './PastQuarterVerificationRow';
import { DataTable } from '../common';

export const PastQuarterVerificationsTable: React.FC<PastQuarterVerificationsTableProps> = ({
  onSelectInvoice,
  employeeQuarterlyStatus,
  showTitle = true
}) => {
  const pastQuarterVerifications = usePastQuarterVerifications(employeeQuarterlyStatus);

  return (
    <div style={{ width: '100%' }}>
      <DataTable
        title="Past Quarter Verifications"
        emptyState={<EmptyState insideCard={!showTitle} />}
        tableHeader={<PastQuarterVerificationsTableHeader />}
        data={pastQuarterVerifications}
        useClassNameStyling={true}
        showTitle={showTitle}
        className="w-100"
        renderRow={(verification) => (
          <PastQuarterVerificationRow
            key={verification.id}
            verification={verification}
            onSelect={onSelectInvoice ? () => onSelectInvoice(verification.id) : undefined}
          />
        )}
      />
    </div>
  );
}; 