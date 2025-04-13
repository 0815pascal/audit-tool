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
      
      <div className="mb-4" style={{ maxWidth: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <strong>Claim Manager</strong> 
          <span style={{ textAlign: 'right' }}>{employee.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <strong>Client</strong> 
          <span style={{ textAlign: 'right' }}>{invoice.clientName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <strong>Policy Number</strong> 
          <span style={{ textAlign: 'right' }}>{invoice.policyNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <strong>Case Number</strong> 
          <span style={{ textAlign: 'right' }}>{invoice.caseNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <strong>Dossier Risk</strong> 
          <span style={{ textAlign: 'right' }}>{invoice.dossierRisk}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <strong>Dossier Name</strong> 
          <span style={{ textAlign: 'right' }}>{invoice.dossierName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <strong>Date</strong> 
          <span style={{ textAlign: 'right' }}>{invoice.date}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', marginBottom: '1rem', justifyContent: 'space-between' }}>
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
      
      <div>
        {!allStepsProcessed ? (
          <p style={{ color: 'var(--info-color)', fontSize: '.9rem', fontWeight: 'bold' }}>
            Please verify all calculation steps before completing the verification.
          </p>
        ) : invoice.isVerified ? (
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <button 
              onClick={() => onVerifyInvoice(false)}
              style={{ 
                backgroundColor: '#00008f',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ⏳ Mark as In Progress
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <button 
              onClick={() => onVerifyInvoice(true)}
              style={{ 
                backgroundColor: hasIncorrectSteps ? '#d24723' : 'var(--success-color)',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={!allStepsProcessed}
            >
              {hasIncorrectSteps ? 
                <span>
                  <span style={{ fontSize: '1em', marginRight: '5px' }}>⛆</span>
                  Complete Verification with Errors
                </span> : 
                "Validate Verification"}
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
      border: '1px solid', 
      borderRadius: '4px',
      borderColor: '#f0f0f0'
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
            <label htmlFor={`verify-step-${step.id}`}>Validate</label>
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id={`incorrect-step-${step.id}`}
              checked={step.isIncorrect}
              onChange={handleIncorrectChange}
              disabled={step.isVerified}
            />
            <label htmlFor={`incorrect-step-${step.id}`}>Incorrect</label>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <label style={{ display: 'flex', marginLeft: '.5rem' }} htmlFor={`comment-${step.id}`}>Audit Comment</label>
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