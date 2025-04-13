import React from 'react';
import { Invoice, CalculationStep } from '../types';
import { employees } from '../mockData';

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
    return (
      <div className="card">
        <h2>Claim Examination</h2>
        <p>Select an employee to view claim examination details for {currentQuarter}.</p>
      </div>
    );
  }

  // Find employee name
  const employee = employees.find(emp => emp.id === invoice.employeeId) || 
                  { id: invoice.employeeId, name: 'Unknown Employee', department: '' };

  // Calculate if all steps are verified or marked as incorrect
  const allStepsProcessed = invoice.calculationSteps.every(step => step.isVerified || step.isIncorrect);
  // Check if any steps are marked as incorrect
  const hasIncorrectSteps = invoice.calculationSteps.some(step => step.isIncorrect);

  return (
    <div className="card">
      <h2>Claim Examination</h2>
      
      <div className="mb-4">
        <div><strong>Client:</strong> {invoice.clientName}</div>
        <div><strong>Policy Number:</strong> {invoice.policyNumber}</div>
        <div><strong>Case Number:</strong> {invoice.caseNumber}</div>
        <div><strong>Dossier Risk:</strong> {invoice.dossierRisk}</div>
        <div><strong>Dossier Name:</strong> {invoice.dossierName}</div>
        <div><strong>Date:</strong> {invoice.date}</div>
        <div><strong>Employee:</strong> {employee.name}</div>
      </div>
      
      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('selectRandomInvoice'))}
          style={{
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Select Another Random Invoice
        </button>
      </div>
      
      <h3>Calculation Steps</h3>
      <div className="mb-4">
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
      
      <div className="mb-4">
        <h3>Total Amount: ${invoice.totalAmount.toFixed(2)}</h3>
      </div>
      
      <div>
        {!allStepsProcessed ? (
          <p style={{ color: 'var(--primary-color)' }}>
            Please verify all calculation steps before completing the verification.
          </p>
        ) : invoice.isVerified ? (
          <div>
            <button 
              onClick={() => onVerifyInvoice(false)}
              style={{ 
                backgroundColor: hasIncorrectSteps ? '#ffb300' : '#00c853',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              ✓ Verification Complete
            </button>
          </div>
        ) : (
          <div>
            <button 
              onClick={() => onVerifyInvoice(true)}
              style={{ 
                backgroundColor: hasIncorrectSteps ? '#ffb300' : '#2196f3',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={!allStepsProcessed}
            >
              {hasIncorrectSteps ? 
                "Complete Verification with Errors" : 
                "Complete Verification"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface CalculationStepItemProps {
  step: CalculationStep;
  onVerifyStep: (stepId: string, verified: boolean) => void;
  onMarkStepIncorrect: (stepId: string, incorrect: boolean) => void;
  onAddComment: (stepId: string, comment: string) => void;
}

const CalculationStepItem: React.FC<CalculationStepItemProps> = ({
  step,
  onVerifyStep,
  onMarkStepIncorrect,
  onAddComment
}) => {
  // Handle verify checkbox change
  const handleVerifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    onVerifyStep(step.id, isChecked);
    
    // If verifying, make sure to uncheck the incorrect checkbox
    if (isChecked && step.isIncorrect) {
      onMarkStepIncorrect(step.id, false);
    }
  };
  
  // Handle incorrect checkbox change
  const handleIncorrectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    onMarkStepIncorrect(step.id, isChecked);
    
    // If marking as incorrect, make sure to uncheck the verify checkbox
    if (isChecked && step.isVerified) {
      onVerifyStep(step.id, false);
    }
  };

  return (
    <div className="mb-4" style={{ 
      padding: '10px', 
      border: '1px solid var(--border-color)', 
      borderRadius: '4px',
      backgroundColor: step.isIncorrect ? 'rgba(211, 47, 47, 0.05)' : (step.isVerified ? 'rgba(0, 200, 83, 0.05)' : 'transparent')
    }}>
      <div className="flex" style={{ justifyContent: 'space-between' }}>
        <div>
          <strong>{step.description}:</strong> 
          {step.value >= 0 ? ' $' + step.value.toFixed(2) : ' -$' + Math.abs(step.value).toFixed(2)}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id={`verify-step-${step.id}`}
              checked={step.isVerified}
              onChange={handleVerifyChange}
              disabled={step.isIncorrect}
            />
            <label htmlFor={`verify-step-${step.id}`}>Verify</label>
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id={`incorrect-step-${step.id}`}
              checked={step.isIncorrect}
              onChange={handleIncorrectChange}
              disabled={step.isVerified}
            />
            <label htmlFor={`incorrect-step-${step.id}`} style={{ color: '#d32f2f' }}>Incorrect</label>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <label htmlFor={`comment-${step.id}`}>Audit Comment:</label>
        <textarea
          id={`comment-${step.id}`}
          value={step.comment}
          onChange={(e) => onAddComment(step.id, e.target.value)}
          placeholder={step.isIncorrect ? "Describe what's incorrect about this calculation..." : "Add verification notes here..."}
          rows={2}
        />
      </div>
    </div>
  );
};

export default InvoiceDetails; 