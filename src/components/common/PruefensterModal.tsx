import React, {useCallback, useEffect, useState} from 'react';
import {Modal} from './Modal';
import {
  CaseAudit,
  CaseAuditData,
  CaseAuditStatus,
  FindingsRecord,
  FindingType,
  RatingOption,
  RatingValue,
  SelectOption
} from '../../types/types';
import {
  CaseAuditId
} from '../../types/brandedTypes';
import {
  ensureUserId,
  createEmptyFindings,
  createCaseAuditId
} from '../../types/typeHelpers';
import {
  SPECIAL_FINDING_ENUM,
  DETAILED_FINDING_ENUM,
  RATING_VALUE_ENUM,
  AUDIT_STATUS_ENUM,
  BUTTON_COLOR,
  BUTTON_SIZE
} from '../../enums';
import {Button, Checkbox, Select, TextArea} from './FormControls';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {useSaveAuditCompletionMutation, updateAuditInProgress} from '../../store/caseAuditSlice';
import {convertStatusToAuditStatus} from '../../utils/statusUtils';
import {useUsers} from '../../hooks/useUsers';

interface PruefensterModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: CaseAudit;
  onVerify?: (auditId: string | CaseAuditId, auditorId: string, caseAuditData: CaseAuditData) => void;
}

export const PruefensterModal: React.FC<PruefensterModalProps> = ({
  isOpen,
  onClose,
  audit,
  onVerify
}) => {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector(state => state.auditUI.currentUserId);
  
  // RTK Query hooks
  const [saveAuditCompletion] = useSaveAuditCompletionMutation();
  
  // Get users from Redux store via useUsers hook
  const { allUsers } = useUsers();
  
  const [currentStatus, setCurrentStatus] = useState<AUDIT_STATUS_ENUM>(
    audit.status ? 
      convertStatusToAuditStatus(audit.status as CaseAuditStatus | AUDIT_STATUS_ENUM) :
      (audit.isCompleted ? AUDIT_STATUS_ENUM.COMPLETED : AUDIT_STATUS_ENUM.PENDING)
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
        if (!userId) return '-';
        
        try {
          const user = allUsers.find(u => u.id === userId);
          if (user && 'initials' in user && user.initials) {
            return user.initials;
          }
        } catch (error) {
          console.error(`Error finding initials for user ${userId}:`, error);
        }
        
        // If we can't find the user, generate initials from the userId
        const initials = userId?.substring(0, 2).toUpperCase() || 'XX';
        return initials;
      };
      
      // Set verifier to initials (whether from existing audit or current user)
      if (audit.auditor) {
        console.log('Using existing auditor ID:', audit.auditor);
        // Use the existing auditor ID
        const auditorId = audit.auditor.toString?.() || String(audit.auditor);
        const verifierInitials = getUserInitials(auditorId);
        setVerifier(verifierInitials);
      } else {
        // Use the current user's initials as the verifier
        const currentUserInitials = getUserInitials(currentUserId || '');
        console.log('Setting verifier to current user initials:', currentUserInitials);
        setVerifier(currentUserInitials);
      }
      
      // Update the current status based on audit
      setCurrentStatus(audit.status ? 
        convertStatusToAuditStatus(audit.status as CaseAuditStatus | AUDIT_STATUS_ENUM) :
        (audit.isCompleted ? AUDIT_STATUS_ENUM.COMPLETED : AUDIT_STATUS_ENUM.PENDING));
      
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
  }, [audit, currentUserId, allUsers]);

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

  // Check if form has any data to determine if status should be IN_PROGRESS
  const hasFormData = useCallback(() => {
    // Check if comment has content
    if (comment.trim()) return true;
    
    // Check if rating is selected
    if (rating) return true;
    
    // Check if any special findings are selected
    if (Object.values(selectedFindings).some(value => value)) return true;
    
    // Check if any detailed findings are selected
    return Object.values(selectedDetailedFindings).some(value => value);
    

  }, [comment, rating, selectedFindings, selectedDetailedFindings]);

  // Update status based on form data
  useEffect(() => {
    if (hasFormData()) {
      setCurrentStatus(AUDIT_STATUS_ENUM.IN_PROGRESS);
    } else {
      // Only reset to NOT_VERIFIED if the audit wasn't already verified
      const auditCompletionStatus = audit.status ? 
        convertStatusToAuditStatus(audit.status as CaseAuditStatus | AUDIT_STATUS_ENUM) :
        (audit.isCompleted ? AUDIT_STATUS_ENUM.COMPLETED : AUDIT_STATUS_ENUM.PENDING);
      if (auditCompletionStatus !== AUDIT_STATUS_ENUM.COMPLETED) {
        setCurrentStatus(audit.isCompleted ? AUDIT_STATUS_ENUM.COMPLETED : AUDIT_STATUS_ENUM.PENDING);
      }
    }
  }, [comment, rating, selectedFindings, selectedDetailedFindings, audit.status, audit.isCompleted, hasFormData]);

  // Update the saveFormState function
  const saveFormState = useCallback(async () => {
    if (!audit || !audit.id) return;
    
    // Convert verifier initials back to user ID
    let auditorId = currentUserId; // Default fallback
    
    // Find user by initials - add safety check for allUsers
    if (verifier && Array.isArray(allUsers) && allUsers.length > 0) {
      const userByInitials = allUsers.find(user => {
        if ('initials' in user && user.initials) {
          return user.initials === verifier;
        }
        return false;
      });
      if (userByInitials) {
        auditorId = userByInitials.id;
      }
    }
    
    // Fall back to current user
    if (!auditorId && currentUserId) {
      auditorId = currentUserId;
    }

    // First update local Redux state
    dispatch(updateAuditInProgress({
      auditId: createCaseAuditId(audit.id),
      userId: ensureUserId(currentUserId),
      auditor: ensureUserId(auditorId),
      comment: comment,
      rating: rating as RatingValue,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    }));

    // Then persist to backend API
    try {
      await saveAuditCompletion({
        auditId: audit.id,
        auditor: auditorId,
        rating: rating,
        comment: comment,
        specialFindings: selectedFindings,
        detailedFindings: selectedDetailedFindings,
        status: 'in_progress',
        isCompleted: false
      }).unwrap();
    } catch (error) {
      console.error('Error saving audit completion:', error);
    }
  }, [audit, verifier, comment, rating, selectedFindings, selectedDetailedFindings, currentUserId, allUsers, dispatch, saveAuditCompletion]);

  // Handle form completion
  const handleComplete = useCallback(async () => {
    if (!audit || !onVerify) return;

    // Convert verifier initials back to user ID
    let auditorId = currentUserId; // Default fallback
    
    // Find user by initials - add safety check for allUsers
    if (verifier && Array.isArray(allUsers) && allUsers.length > 0) {
      const userByInitials = allUsers.find(user => {
        if ('initials' in user && user.initials) {
          return user.initials === verifier;
        }
        return false;
      });
      if (userByInitials) {
        auditorId = userByInitials.id;
      }
    }
    
    // Fall back to current user
    if (!auditorId && currentUserId) {
      auditorId = currentUserId;
    }

    // Prepare the current form data
    const currentFormData: CaseAuditData = {
      comment,
      rating: rating as RatingValue,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    };

    // Save the form state to Redux for persistence
    await saveFormState();

    // Pass the current form data directly to the completion handler
    // Convert UserId to string for the onVerify function signature
    onVerify(audit.id, auditorId, currentFormData);
  }, [audit, onVerify, verifier, comment, rating, selectedFindings, selectedDetailedFindings, currentUserId, allUsers, saveFormState]);

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
      title="Prueffenster"
    >
      <div className="pruefenster-content">
        {/* Case Information - moved outside of box */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '8px 16px', 
          fontSize: '14px',
          lineHeight: '1.3',
          textAlign: 'left',
          fontFamily: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              Case Number
            </span>
            <span style={{ marginTop: '2px', color: '#212529', fontWeight: '500', textAlign: 'left' }}>
            {audit.id}
          </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
          <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Status
            </span>
          <span 
            className={`status-badge ${currentStatus}`}
            style={{
              color: 
                currentStatus === AUDIT_STATUS_ENUM.COMPLETED ? 'var(--success-color)' : 
                currentStatus === AUDIT_STATUS_ENUM.IN_PROGRESS ? 'var(--warning-color)' : /* warning color */
                'var(--danger-color)', /* danger color */
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
            }}
          >
            {currentStatus === AUDIT_STATUS_ENUM.COMPLETED ? 'Verifiziert' : 
             currentStatus === AUDIT_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 
             'Nicht Verifiziert'}
          </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              Policy Number
            </span>
            <span style={{ marginTop: '2px', color: '#212529', fontWeight: '500', textAlign: 'left' }}>
              {audit.policyNumber}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
              Client
            </span>
            <span style={{ marginTop: '2px', color: '#212529', fontWeight: '500', textAlign: 'right' }}>
              {audit.clientName}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              Coverage Amount
            </span>
            <span style={{ marginTop: '2px', fontWeight: '500', fontSize: '14px', textAlign: 'left' }}>
              {new Intl.NumberFormat('de-CH', { 
                style: 'currency', 
                currency: audit.notifiedCurrency ?? 'CHF'
              }).format(audit.coverageAmount)}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
              Fallbearbeiter
            </span>
            <span style={{ marginTop: '2px', color: '#212529', fontWeight: '500', textAlign: 'right' }}>
              {(() => {
                const user = allUsers.find(u => u.id === audit.userId);
                return user ? user.displayName : audit.userId;
              })()}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              Quarter
            </span>
            <span style={{ marginTop: '2px', color: '#212529', fontWeight: '500', textAlign: 'left' }}>
              {audit.quarter}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
              Notification Date
            </span>
            <span style={{ marginTop: '2px', color: '#212529', fontWeight: '500', textAlign: 'right' }}>
              {audit.notificationDate ? new Date(audit.notificationDate).toLocaleDateString('de-CH') : '-'}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              Dossier
            </span>
            <span style={{ marginTop: '2px', color: '#212529', fontWeight: '500', textAlign: 'left' }}>
              {audit.dossierName}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Prüfer
            </span>
            <span style={{ marginTop: '2px', color: '#212529', fontWeight: '500'}}>
              {verifier || '-'}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
              {/* Empty cell to maintain grid balance */}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h4 style={{ 
            textAlign: 'left',
            fontFamily: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif'
          }}>Prüfergebnis</h4>
          <Select
            id="pruefenster-rating"
            options={ratingOptions}
            value={rating}
            onChange={handleRatingChange}
          />
        </div>

        <div className="mb-4">
          <TextArea
            id="pruefenster-comment"
            value={comment}
            onChange={setComment}
            placeholder="Geben Sie hier Ihren Kommentar ein..."
            rows={4}
          />
        </div>

        <div className="mb-4">
          <h4 style={{ 
            textAlign: 'left',
            fontFamily: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif'
          }}>Spezielle Erkenntnisse</h4>
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
          <h4 style={{ 
            textAlign: 'left',
            fontFamily: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif'
          }}>Detaillierte Prüfergebnisse</h4>
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
            size={BUTTON_SIZE.MEDIUM}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleComplete}
            color={BUTTON_COLOR.PRIMARY}
            size={BUTTON_SIZE.MEDIUM}
            disabled={!verifier.trim()}
          >
            Bestätigen
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 