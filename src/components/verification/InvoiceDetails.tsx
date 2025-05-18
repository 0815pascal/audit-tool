import React from 'react';
import { Invoice } from '../../types';
import CalculationStepItem from './CalculationStepItem';
import { Button, LabelValue, Card } from '../common';
import { VerifiedInvoice } from '../verified-invoices/types';

// Empty state component when no invoice is selected
const EmptyInvoiceState = ({ currentQuarter }: { currentQuarter: string }) => (
  <Card title="Claim Examination">
    <p>Select an employee to view claim examination details for {currentQuarter}.</p>
  </Card>
);

// Component for displaying invoice/claim information
export const ClaimInformation = ({ invoice }: { invoice: Invoice | VerifiedInvoice }) => {
  // Get employee name from employeeName property if available, or generate one from employeeId
  const employeeName = 'employeeName' in invoice && invoice.employeeName
    ? invoice.employeeName
    : `Employee ${invoice.employeeId}`;
  
  return (
    <div className="mb-4">
      <LabelValue label="Claim Manager" value={employeeName} />
      <LabelValue label="Client" value={invoice.clientName} />
      <LabelValue label="Policy Number" value={invoice.policyNumber} />
      <LabelValue label="Case Number" value={invoice.caseNumber} />
      {/* Render dossier risk if available */}
      { 'dossierRisk' in invoice && (
        <LabelValue label="Dossier Risk" value={invoice.dossierRisk} />
      ) }
      <LabelValue label="Dossier Name" value={invoice.dossierName} />
      <LabelValue label="Date" value={invoice.date} />
      {/* Show claims status and coverage amount if available */}
      {'claimsStatus' in invoice && (
        <LabelValue label="Claims Status" value={(invoice as any).claimsStatus} />
      )}
      {'coverageAmount' in invoice && (
        <LabelValue label="Coverage Amount" value={`CHF ${(invoice as any).coverageAmount.toFixed(2)}`} />
      )}
    </div>
  );
};

// Component for the verification action buttons
const VerificationActions = ({ 
  isVerified, 
  allStepsProcessed, 
  hasIncorrectSteps,
  onVerifyInvoice 
}: { 
  isVerified: boolean, 
  allStepsProcessed: boolean, 
  hasIncorrectSteps: boolean,
  onVerifyInvoice: (verified: boolean) => void 
}) => {
  if (!allStepsProcessed) {
    return (
      <p style={{color: 'var(--info-color)', fontSize: '.9rem', fontWeight: 'bold'}}>
        Please verify all calculation steps before completing the verification.
      </p>
    );
  }

  if (isVerified) {
    return (
      <div style={{display: 'flex', justifyContent: 'end'}}>
        <Button
          onClick={() => onVerifyInvoice(false)}
          color="info"
          size="large"
        >
          ⏳ Mark as In Progress
        </Button>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', justifyContent: 'end'}}>
      <Button
        onClick={() => onVerifyInvoice(true)}
        color={hasIncorrectSteps ? "danger" : "success"}
        size="large"
        disabled={!allStepsProcessed}
      >
        {hasIncorrectSteps ?
          <span><span style={{fontSize: '1em', marginRight: '5px'}}>⛆</span>Complete Verification with Errors</span> :
          "Validate Verification"}
      </Button>
    </div>
  );
};

// Main component with reduced complexity
interface InvoiceDetailsProps {
  invoice: Invoice | null;
  onVerifyStep: (stepId: string, verified: boolean) => void;
  onMarkStepIncorrect: (stepId: string, incorrect: boolean) => void;
  onAddComment: (stepId: string, comment: string) => void;
  onVerifyInvoice: (verified: boolean) => void;
  currentQuarter: string;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  onVerifyStep,
  onMarkStepIncorrect,
  onAddComment,
  onVerifyInvoice,
  currentQuarter
}) => {
  if (!invoice) {
    return <EmptyInvoiceState currentQuarter={currentQuarter} />;
  }

  // Calculate if all steps are verified or marked as incorrect
  const allStepsProcessed = invoice.calculationSteps.every(step => step.isVerified || step.isIncorrect);
  // Check if any steps are marked as incorrect
  const hasIncorrectSteps = invoice.calculationSteps.some(step => step.isIncorrect);

  return (
    <Card title="Claim Information">
      <ClaimInformation invoice={invoice} />
      
      <div className="calculation-steps mt-4">
        <h3>Calculation Steps</h3>
        {invoice.calculationSteps.map((step) => (
          <CalculationStepItem
            key={step.id}
            step={step}
            onVerifyStep={onVerifyStep}
            onMarkStepIncorrect={onMarkStepIncorrect}
            onAddComment={onAddComment}
          />
        ))}
      </div>

      <VerificationActions 
        isVerified={invoice.isVerified}
        allStepsProcessed={allStepsProcessed}
        hasIncorrectSteps={hasIncorrectSteps}
        onVerifyInvoice={onVerifyInvoice}
      />
    </Card>
  );
};

export default InvoiceDetails; 