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
  ensureCaseAuditId
} from '../../caseAuditTypes';
import { Checkbox, TextArea, Button, Select } from './FormControls';
import { useToast } from '../../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateAuditInProgress } from '../../store/caseAuditSlice';
import { INPUT_TYPE_ENUM, VERIFICATION_STATUS_ENUM, RATING_VALUE_ENUM, DETAILED_FINDING_ENUM, SPECIAL_FINDING_ENUM, TOAST_TYPE, BUTTON_COLOR, BUTTON_SIZE } from '../../enums';

// Import the users directly from the mock data
import { users } from '../../mocks/handlers';

interface PruefensterModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: CaseAudit;
  onVerify?: (auditId: string | CaseAuditId, verifierId: string, caseAuditData: CaseAuditData) => void;
  onReject?: (auditId: string | CaseAuditId, verifierId: string, caseAuditData: CaseAuditData) => void;
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
  
  const [currentStatus, setCurrentStatus] = useState<VERIFICATION_STATUS_ENUM>(
    audit.status as unknown as VERIFICATION_STATUS_ENUM || 
    (audit.isVerified ? VERIFICATION_STATUS_ENUM.VERIFIED : VERIFICATION_STATUS_ENUM.NOT_VERIFIED)
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
      
      // Helper function to get user initials by user ID
      const getUserInitials = (userId: string): string => {
        try {
          const user = users.find(u => u.id === userId);
          if (user && 'initials' in user && user.initials) {
            console.log(`Found initials for user ${userId}:`, user.initials);
            return user.initials;
          }
        } catch (error) {
          console.error(`Error finding initials for user ${userId}:`, error);
        }
        
        // If we can't find the user, generate initials from the userId
        const initials = userId?.substring(0, 2).toUpperCase() || 'XX';
        console.log(`Generated fallback initials for user ${userId}:`, initials);
        return initials;
      };
      
      // Set verifier to initials (whether from existing audit or current user)
      if (audit.verifier) {
        console.log('Using existing verifier ID:', audit.verifier);
        // Convert verifier ID to string and get initials
        const verifierId = audit.verifier.toString?.() || String(audit.verifier);
        const verifierInitials = getUserInitials(verifierId);
        setVerifier(verifierInitials);
      } else {
        // Use the current user's initials as the verifier
        const currentUserInitials = getUserInitials(currentUserId || '');
        console.log('Setting verifier to current user initials:', currentUserInitials);
        setVerifier(currentUserInitials);
      }
      
      // Update the current status based on audit
      setCurrentStatus(audit.status as unknown as VERIFICATION_STATUS_ENUM || 
        (audit.isVerified ? VERIFICATION_STATUS_ENUM.VERIFIED : VERIFICATION_STATUS_ENUM.NOT_VERIFIED));
      
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
    
    // Convert verifier initials back to user ID
    let verifierId = currentUserId; // Default to current user
    
    if (verifier) {
      // Find user by initials
      const userByInitials = users.find(u => 
        'initials' in u && u.initials === verifier.toUpperCase()
      );
      
      if (userByInitials) {
        verifierId = userByInitials.id;
      } else {
        // If we can't find by initials, use current user
        console.warn(`Could not find user with initials ${verifier}, using current user`);
      }
    }
    
    const caseAuditData: CaseAuditData = {
      comment,
      rating,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    };
    
    console.log('=== DEBUG: saveFormState ===');
    console.log('audit.id:', audit.id);
    console.log('audit.userId:', audit.userId);
    console.log('verifierId:', verifierId);
    console.log('caseAuditData:', caseAuditData);
    console.log('rating being saved:', rating);
    console.log('=== END DEBUG ===');
    
    dispatch(updateAuditInProgress({
      auditId: ensureCaseAuditId(audit.id),
      userId: ensureUserId(audit.userId),
      verifier: ensureUserId(verifierId || currentUserId),
      ...caseAuditData
    }));
    
    showToast('Form saved', TOAST_TYPE.SUCCESS);
  };

  const handleVerify = () => {
    if (!onVerify) {
      console.error('No onVerify handler provided');
      return;
    }
    
    console.log('=== DEBUG: handleVerify ===');
    console.log('Before verification - rating:', rating);
    console.log('audit.id:', audit.id);
    
    // Convert verifier initials back to user ID
    let verifierId = currentUserId; // Default to current user
    
    if (verifier) {
      // Find user by initials
      const userByInitials = users.find(u => 
        'initials' in u && u.initials === verifier.toUpperCase()
      );
      
      if (userByInitials) {
        verifierId = userByInitials.id;
      } else {
        // If we can't find by initials, use current user
        console.warn(`Could not find user with initials ${verifier}, using current user`);
      }
    }
    
    // Prepare the current form data
    const currentFormData = {
      comment,
      rating,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    };
    
    console.log('Current form data being passed:', currentFormData);
    console.log('=== END DEBUG ===');
    
    // Save the form state to Redux for persistence
    saveFormState();
    
    // Pass the current form data directly to the verification handler
    // instead of relying on Redux state that might not be updated yet
    onVerify(audit.id, ensureUserId(verifierId || currentUserId), currentFormData);
    
    showToast('Audit verified', TOAST_TYPE.SUCCESS);
  };

  const handleReject = () => {
    if (!onReject) {
      console.error('No onReject handler provided');
      return;
    }
    
    // Convert verifier initials back to user ID
    let verifierId = currentUserId; // Default to current user
    
    if (verifier) {
      // Find user by initials
      const userByInitials = users.find(u => 
        'initials' in u && u.initials === verifier.toUpperCase()
      );
      
      if (userByInitials) {
        verifierId = userByInitials.id;
      } else {
        // If we can't find by initials, use current user
        console.warn(`Could not find user with initials ${verifier}, using current user`);
      }
    }
    
    // Prepare the current form data
    const currentFormData = {
      comment,
      rating,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    };
    
    // Save the form state to Redux for persistence
    saveFormState();
    
    // Pass the current form data directly to the rejection handler
    onReject(audit.id, ensureUserId(verifierId || currentUserId), currentFormData);
    
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
            placeholder="Geben Sie hier Ihren Kommentar ein..."
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
            onClick={handleCloseModal}
            color={BUTTON_COLOR.TEXT}
            size={BUTTON_SIZE.LARGE}
          >
            Abbrechen
          </Button>
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
            Bestätigen
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 