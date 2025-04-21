import React from 'react';
import { usePastQuarterVerifications } from '../../hooks/usePastQuarterVerifications';
import { PastQuarterVerificationsTableProps } from './types';
import { EmptyState } from './EmptyState';
import { PastQuarterVerificationsTableHeader } from './PastQuarterVerificationsTableHeader';
import { PastQuarterVerificationRow } from './PastQuarterVerificationRow';

export const PastQuarterVerificationsTable: React.FC<PastQuarterVerificationsTableProps> = ({
  onSelectInvoice,
  employeeQuarterlyStatus
}) => {
  const pastQuarterVerifications = usePastQuarterVerifications(employeeQuarterlyStatus);

  if (pastQuarterVerifications.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="mb-4">
      <h2>Past Quarter Verifications</h2>
      <div className="table-responsive">
        <table className="table table-bordered">
          <PastQuarterVerificationsTableHeader />
          <tbody>
            {pastQuarterVerifications.map((verification) => (
              <PastQuarterVerificationRow
                key={verification.id}
                verification={verification}
                onSelect={onSelectInvoice ? () => onSelectInvoice(verification.id) : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 