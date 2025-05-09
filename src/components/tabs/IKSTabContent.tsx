import React, { useState, useEffect } from 'react';
import { useVerificationHandlers } from '../../hooks/useVerificationHandlers';
import { useVerifiedInvoices } from '../../hooks/useVerifiedInvoices';
import { VerifiedInvoice } from '../verified-invoices/types';
import { DataTable, tableHeaderStyle, tableCellStyle, headerRowStyle, Select, Checkbox, PruefensterModal, Button } from '../common';
import { quarterOptions, managerOptions, statusOptions, VerificationStatusOption } from '../../mockData';
import { exportAuditReport } from '../../services/auditService';

const IksTabContent: React.FC = () => {
  const { employeeQuarterlyStatus, currentQuarterFormatted } = useVerificationHandlers();
  const data = useVerifiedInvoices(employeeQuarterlyStatus, currentQuarterFormatted);

  // Filter state
  const [filterQuarter, setFilterQuarter] = useState<string>(currentQuarterFormatted);
  const [filterManager, setFilterManager] = useState<string>('');
  const [filterStatuses, setFilterStatuses] = useState<Record<VerificationStatusOption, boolean>>(
    () => statusOptions.reduce((acc, status) => ({ ...acc, [status]: true }), {} as Record<VerificationStatusOption, boolean>)
  );

  // Additional filter state
  const [filterClaimsStatus, setFilterClaimsStatus] = useState<string>('');
  const [filterMinCoverage, setFilterMinCoverage] = useState<string>('');
  const [filterMaxCoverage, setFilterMaxCoverage] = useState<string>('');
  const claimsStatusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'FULL_COVER', label: 'Full Cover' },
    { value: 'PARTIAL_COVER', label: 'Partial Cover' },
    { value: 'NO_COVER', label: 'No Cover' },
  ];

  // Loading & error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate loading effect (replace with real data fetching later)
  useEffect(() => {
    setIsLoading(true);
    try {
      // no-op for mock
      setIsLoading(false);
    } catch (e) {
      setError('Failed to load records.');
      setIsLoading(false);
    }
  }, []);

  // Derive invoice status label
  const deriveStatus = (invoice: VerifiedInvoice): VerificationStatusOption =>
    invoice.isFullyVerified
      ? 'Erfolgreich erfüllt'
      : invoice.hasIncorrectCalculations
      ? 'Teilweise nicht erfüllt'
      : 'Überwiegend nicht erfüllt';

  // Apply all filters
  const filteredData = data.filter(invoice =>
    (filterQuarter ? invoice.quarter === filterQuarter : true) &&
    (filterManager ? invoice.employeeId === filterManager : true) &&
    filterStatuses[deriveStatus(invoice)] &&
    (filterClaimsStatus ? invoice.claimsStatus === filterClaimsStatus : true) &&
    (filterMinCoverage ? invoice.coverageAmount >= parseFloat(filterMinCoverage) : true) &&
    (filterMaxCoverage ? invoice.coverageAmount <= parseFloat(filterMaxCoverage) : true)
  );

  // Modal state for Prüffenster
  const [selectedInvoice, setSelectedInvoice] = useState<VerifiedInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const IKSTableHeader = () => (
    <thead>
      <tr style={headerRowStyle}>
        <th style={tableHeaderStyle}>Case-ID</th>
        <th style={tableHeaderStyle}>Claims Manager</th>
        <th style={tableHeaderStyle}>Prüfergebnis</th>
        <th style={tableHeaderStyle}>Prüfer</th>
      </tr>
    </thead>
  );

  const IKSTableRow: React.FC<{ invoice: VerifiedInvoice; onSelect: () => void }> = ({ invoice, onSelect }) => (
    <tr style={{ cursor: 'pointer' }} onClick={onSelect}>
      <td style={tableCellStyle}>{invoice.id}</td>
      <td style={tableCellStyle}>{invoice.employeeName}</td>
      <td style={tableCellStyle}>
        {invoice.isFullyVerified
          ? 'Erfolgreich erfüllt'
          : invoice.hasIncorrectCalculations
            ? 'Teilweise nicht erfüllt'
            : 'Überwiegend nicht erfüllt'}
      </td>
      <td style={tableCellStyle}>{invoice.auditorCode}</td>
    </tr>
  );

  return (
    <>
      {/* Loading & error feedback */}
      {isLoading && <p>Loading IKS records...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Filter controls */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <Select
          id="quarter-filter"
          label="Quarter"
          options={quarterOptions.map(q => ({ value: q, label: q }))}
          value={filterQuarter}
          onChange={setFilterQuarter}
        />
        <Select
          id="manager-filter"
          label="Manager"
          options={[{ value: '', label: 'All Managers' }, ...managerOptions]}
          value={filterManager}
          onChange={setFilterManager}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1rem', gap: '0.5rem' }}>
          {statusOptions.map(status => (
            <Checkbox
              key={status}
              id={`status-${status}`}
              label={status}
              checked={filterStatuses[status]}
              onChange={() =>
                setFilterStatuses(prev => ({ ...prev, [status]: !prev[status] }))
              }
            />
          ))}
        </div>
        <Select
          id="claims-status-filter"
          label="Claims Status"
          options={claimsStatusOptions}
          value={filterClaimsStatus}
          onChange={setFilterClaimsStatus}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="min-coverage">Min Coverage</label>
            <input
              type="number"
              id="min-coverage"
              value={filterMinCoverage}
              onChange={e => setFilterMinCoverage(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="max-coverage">Max Coverage</label>
            <input
              type="number"
              id="max-coverage"
              value={filterMaxCoverage}
              onChange={e => setFilterMaxCoverage(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Button
            onClick={() => exportAuditReport(filterQuarter)}
            color="success"
            disabled={isLoading}
          >
            Export CSV
          </Button>
        </div>
      </div>
      <DataTable<VerifiedInvoice>
        title=""
        showTitle={false}
        emptyState={<p className="text-left">No audit records for this quarter.</p>}
        tableHeader={<IKSTableHeader />}
        data={filteredData}
        renderRow={(invoice) => (
          <IKSTableRow
            key={invoice.id}
            invoice={invoice}
            onSelect={() => {
              setSelectedInvoice(invoice);
              setIsModalOpen(true);
            }}
          />
        )}
      />
      {/* Prüffenster detail modal */}
      <PruefensterModal
        isOpen={isModalOpen}
        invoice={selectedInvoice}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default IksTabContent; 