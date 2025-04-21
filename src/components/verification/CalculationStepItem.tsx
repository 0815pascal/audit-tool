import React from 'react';
import { CalculationStep } from '../../types';
import { Checkbox, TextArea } from '../common/FormControls';

// Component for comment input area
interface StepCommentInputProps {
  stepId: string;
  comment: string;
  onAddComment: (stepId: string, comment: string) => void;
  isIncorrect: boolean;
}

const StepCommentInput: React.FC<StepCommentInputProps> = ({
  stepId,
  comment,
  onAddComment,
  isIncorrect
}) => (
  <TextArea
    id={`comment-${stepId}`}
    label="Audit Comment"
    value={comment}
    onChange={(value) => onAddComment(stepId, value)}
    placeholder={isIncorrect ? "Describe what's incorrect about this calculation..." : "Add verification notes here..."}
    rows={2}
  />
);

// Main component for a calculation step item
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
          <Checkbox
            id={`verify-step-${step.id}`}
            label="Validate"
            checked={step.isVerified}
            onChange={handleVerifyChange}
            disabled={step.isIncorrect}
          />
          <Checkbox
            id={`incorrect-step-${step.id}`}
            label="Incorrect"
            checked={step.isIncorrect}
            onChange={handleIncorrectChange}
            disabled={step.isVerified}
          />
        </div>
      </div>

      <StepCommentInput
        stepId={step.id}
        comment={step.comment}
        onAddComment={onAddComment}
        isIncorrect={step.isIncorrect}
      />
    </div>
  );
};

export default CalculationStepItem; 