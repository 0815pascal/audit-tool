import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { 
  SelectOption, 
  RatingOption, 
  RatingValue, 
  FindingType, 
  FindingsRecord,
  createEmptyFindings,
  ensureUserId
} from '../../types';
import {
  CaseAudit,
  CaseAuditData,
  CaseAuditId,
  CaseAuditStatus,
  ensureCaseAuditId
} from '../../caseAuditTypes';
import { Checkbox, TextArea, Button, Select } from './FormControls';
import { useToast } from '../../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateAuditInProgress } from '../../store/caseAuditSlice';
import { INPUT_TYPE_ENUM, VERIFICATION_STATUS_ENUM, RATING_VALUE_ENUM, DETAILED_FINDING_ENUM, SPECIAL_FINDING_ENUM, TOAST_TYPE, BUTTON_COLOR, BUTTON_SIZE } from '../../enums';

// Import the users directly from the mock data
import { users } from '../../mocks/handlers';

// Import the case audit handlers from the hooks directory
import { useCaseAuditHandlers } from '../../hooks/useCaseAuditHandlers';

interface PruefensterModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: CaseAudit;
  onVerify?: (auditId: string | CaseAuditId) => void;
  onReject?: (auditId: string | CaseAuditId) => void;
}

export const PruefensterModal: React.FC<PruefensterModalProps> = ({
  isOpen,
  onClose,
  audit,
  onVerify,
  onReject
}) => {
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector(state => state.caseAudit.currentUserId);
  
  const [currentStatus, setCurrentStatus] = useState<CaseAuditStatus>(
    audit.status || (audit.isVerified ? VERIFICATION_STATUS_ENUM.VERIFIED : VERIFICATION_STATUS_ENUM.NOT_VERIFIED)
  );
  
  const ratingOptions: RatingOption[] = [
    { value: RATING_VALUE_ENUM.NOT_FULFILLED, label: '🟥 Überwiegend nicht erfüllt' },
    { value: RATING_VALUE_ENUM.PARTIALLY_FULFILLED, label: '🟧 Teilweise nicht erfüllt' },
    { value: RATING_VALUE_ENUM.MOSTLY_FULFILLED, label: '🟨 Überwiegend erfüllt' },
    { value: RATING_VALUE_ENUM.SUCCESSFULLY_FULFILLED, label: '🟩 Erfolgreich erfüllt' },
    { value: RATING_VALUE_ENUM.EXCELLENTLY_FULFILLED, label: '🟢 Ausgezeichnet erfüllt' },
  ];

  const specialFindingsOptions: SelectOption<FindingType>[] = [
    { value: SPECIAL_FINDING_ENUM.FEEDBACK, label: 'Kundenfeedback über ausgezeichnete Bearbeitung' },
    { value: SPECIAL_FINDING_ENUM.COMMUNICATION, label: 'Optimale Kundenkommunikation' },
    { value: SPECIAL_FINDING_ENUM.RECOURSE, label: 'Überdurchschnittliche Leistung im Regress oder zur Schadenvermeidung' },
    { value: SPECIAL_FINDING_ENUM.NEGOTIATION, label: 'Besonderes Verhandlungsgeschick' },
    { value: SPECIAL_FINDING_ENUM.PERFECT_TIMING, label: 'Perfekte zeitliche und inhaltliche Bearbeitung' },
  ];

  const detailedFindingsOptions: SelectOption<FindingType>[] = [
    { value: DETAILED_FINDING_ENUM.FACTS_INCORRECT, label: 'Relevanter Sachverhalt nicht plausibel dargestellt.' },
    { value: DETAILED_FINDING_ENUM.TERMS_INCORRECT, label: 'Liefer-/Vertragsbedingungen nicht erfasst.' },
    { value: DETAILED_FINDING_ENUM.COVERAGE_INCORRECT, label: 'Deckungssumme nicht korrekt erfasst.' },
    { value: DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED, label: 'Zusatzdeckungen nicht berücksichtigt.' },
    { value: DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED, label: 'Entschädigungsabrechnung nicht fristgerecht.' },
    { value: DETAILED_FINDING_ENUM.COLLECTION_INCORRECT, label: 'Falsche oder keine Inkassomassnahmen.' },
    { value: DETAILED_FINDING_ENUM.RECOURSE_WRONG, label: 'Regressmassnahmen falsch beurteilt.' },
    { value: DETAILED_FINDING_ENUM.COST_RISK_WRONG, label: 'Kostenrisiko rechtlicher Beitreibung falsch eingeschätzt.' },
    { value: DETAILED_FINDING_ENUM.BPR_WRONG, label: 'BPR nicht richtig instruiert.' },
    { value: DETAILED_FINDING_ENUM.COMMUNICATION_POOR, label: 'Kommunikation mit VN verbesserungswürdig.' },
  ];
  
  const [comment, setComment] = useState(audit.comment || '');
  const [rating, setRating] = useState<RatingValue>(audit.rating || '');
  const [verifier, setVerifier] = useState('');
  const [selectedFindings, setSelectedFindings] = useState<FindingsRecord>(
    () => {
      // Start with empty findings
      const initialValues = createEmptyFindings();
      
      // Apply any existing values from the audit
      if (audit.specialFindings) {
        Object.entries(audit.specialFindings).forEach(([key, value]) => {
          const findingKey = key as FindingType;
          if (findingKey in initialValues) {
            initialValues[findingKey] = value;
          }
        });
      }
      
      return initialValues;
    }
  );
  
  const [selectedDetailedFindings, setSelectedDetailedFindings] = useState<FindingsRecord>(
    () => {
      // Start with empty findings
      const initialValues = createEmptyFindings();
      
      // Apply any existing values from the audit
      if (audit.detailedFindings) {
        Object.entries(audit.detailedFindings).forEach(([key, value]) => {
          const findingKey = key as FindingType;
          if (findingKey in initialValues) {
            initialValues[findingKey] = value;
          }
        });
      }
      
      return initialValues;
    }
  );

  // Load initial values from audit (including any in-progress data)
  useEffect(() => {
    if (audit) {
      setComment(audit.comment || '');
      setRating(audit.rating || '');
      
      // Define getCurrentUserInitials inside the effect
      const getCurrentUserInitials = (): string => {
        // Try to get the current user from the mock data
        try {
          const currentUser = users.find(u => u.id === currentUserId);
          if (currentUser && 'initials' in currentUser && currentUser.initials) {
            console.log('Found current user initials:', currentUser.initials);
            return currentUser.initials;
          }
        } catch (error) {
          console.error('Error finding current user initials:', error);
        }
        
        // If we can't find the user, generate initials from the currentUserId
        const initials = currentUserId?.substring(0, 2).toUpperCase() || 'XX';
        console.log('Generated fallback initials for current user:', initials);
        return initials;
      };
      
      // If the audit already has a verifier, use that
      // Otherwise, use the current user's initials
      if (audit.verifier) {
        console.log('Using existing verifier:', audit.verifier);
        // Handle UserId (branded type) - we need to convert to string for display
        // Use type assertion to handle the branded type
        const verifierId = audit.verifier.toString?.() || String(audit.verifier);
        setVerifier(verifierId);
      } else {
        // Use the current user's initials as the verifier
        const currentUserInitials = getCurrentUserInitials();
        console.log('Setting verifier to current user initials:', currentUserInitials);
        setVerifier(currentUserInitials);
      }
      
      // Update the current status based on audit
      setCurrentStatus(audit.status || (audit.isVerified ? VERIFICATION_STATUS_ENUM.VERIFIED : VERIFICATION_STATUS_ENUM.NOT_VERIFIED));
      
      // Update findings with all options set to false by default
      setSelectedFindings(() => {
        // Start with a fresh empty record
        const updatedFindings = createEmptyFindings();
        
        // Apply any existing values from the audit
        if (audit.specialFindings) {
          Object.entries(audit.specialFindings).forEach(([key, value]) => {
            const findingKey = key as FindingType;
            if (findingKey in updatedFindings) {
              updatedFindings[findingKey] = value;
            }
          });
        }
        
        return updatedFindings;
      });
      
      // Update detailed findings with all options set to false by default
      setSelectedDetailedFindings(() => {
        // Start with a fresh empty record
        const updatedFindings = createEmptyFindings();
        
        // Apply any existing values from the audit
        if (audit.detailedFindings) {
          Object.entries(audit.detailedFindings).forEach(([key, value]) => {
            const findingKey = key as FindingType;
            if (findingKey in updatedFindings) {
              updatedFindings[findingKey] = value;
            }
          });
        }
        
        return updatedFindings;
      });
    }
  }, [audit, currentUserId]);

  const handleCheckboxChange = (value: FindingType, checked: boolean) => {
    setSelectedFindings(prev => ({ ...prev, [value]: checked }));
  };

  const handleDetailedChange = (value: FindingType, checked: boolean) => {
    setSelectedDetailedFindings(prev => ({ ...prev, [value]: checked }));
  };

  // Handle rating change with the correct typing
  const handleRatingChange = (value: RatingValue) => {
    setRating(value);
  };

  // Update the saveFormState function
  const saveFormState = () => {
    setCurrentStatus(VERIFICATION_STATUS_ENUM.IN_PROGRESS);
    
    const caseAuditData: CaseAuditData = {
      comment,
      rating,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    };
    
    dispatch(updateAuditInProgress({
      auditId: ensureCaseAuditId(audit.id),
      userId: ensureUserId(audit.userId),
      verifier: ensureUserId(verifier),
      ...caseAuditData
    }));
    
    showToast('Form saved', TOAST_TYPE.SUCCESS);
  };

  const handleVerify = () => {
    if (!onVerify) {
      console.error('No onVerify handler provided');
      return;
    }
    
    onVerify(audit.id);
    
    showToast('Audit verified', TOAST_TYPE.SUCCESS);
  };

  const handleReject = () => {
    if (!onReject) {
      console.error('No onReject handler provided');
      return;
    }
    
    onReject(audit.id);
    
    showToast('Audit rejected', TOAST_TYPE.ERROR);
  };

  // Handle when modal is being closed
  const handleCloseModal = () => {
    // Save current form state to Redux
    saveFormState();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Prüfenster"
    >
      <div className="pruefenster-content">
        {/* Status indicator */}
        <div className="mb-4">
          <div className="status-indicator">
            <h4>Status</h4>
            <div 
              className={`status-badge ${currentStatus}`}
              style={{
                backgroundColor: 
                  currentStatus === VERIFICATION_STATUS_ENUM.VERIFIED ? 'var(--success-color)' : 
                  currentStatus === VERIFICATION_STATUS_ENUM.IN_PROGRESS ? '#f0ad4e' : /* warning color */
                  '#d9534f', /* danger color */
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'inline-block',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.8rem'
              }}
            >
              {currentStatus === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Verifiziert' : 
               currentStatus === VERIFICATION_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 
               'Nicht Verifiziert'}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4>Verification Details</h4>
          <div className="form-group">
            <label htmlFor="verifier">Prüfer (Initialen)</label>
            <input
              type={INPUT_TYPE_ENUM.TEXT}
              id="verifier"
              className="form-control"
              value={verifier}
              onChange={(e) => setVerifier(e.target.value)}
              maxLength={3}
              placeholder="z.B. ABC"
            />
          </div>
        </div>

        <div className="mb-4">
          <h4>Freitext</h4>
          <TextArea
            id="pruefenster-comment"
            label="Kommentar"
            value={comment}
            onChange={setComment}
            rows={4}
          />
        </div>

        <div className="mb-4">
          <h4>Prüfergebnis</h4>
          <Select
            id="pruefenster-rating"
            options={ratingOptions}
            value={rating}
            onChange={handleRatingChange}
          />
        </div>

        <div className="mb-4">
          <h4>Spezielle Erkenntnisse</h4>
          <div>
            {specialFindingsOptions.map(opt => (
              <Checkbox
                key={opt.value}
                id={`finding-${opt.value}`}
                label={opt.label}
                checked={selectedFindings[opt.value]}
                onChange={(e) => handleCheckboxChange(opt.value, e.target.checked)}
              />
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4>Detaillierte Prüfergebnisse</h4>
          <div>
            {detailedFindingsOptions.map(opt => (
              <Checkbox
                key={opt.value}
                id={`detailed-${opt.value}`}
                label={opt.label}
                checked={selectedDetailedFindings[opt.value]}
                onChange={(e) => handleDetailedChange(opt.value, e.target.checked)}
              />
            ))}
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <Button
            onClick={handleReject}
            color={BUTTON_COLOR.DANGER}
            size={BUTTON_SIZE.LARGE}
          >
            Ablehnen
          </Button>
          <Button
            onClick={handleVerify}
            color={BUTTON_COLOR.SUCCESS}
            size={BUTTON_SIZE.LARGE}
            disabled={!verifier.trim()}
          >
            Genehmigen
          </Button>
          <Button
            onClick={saveFormState}
            color={BUTTON_COLOR.PRIMARY}
            size={BUTTON_SIZE.LARGE}
          >
            Zwischenspeichern
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 