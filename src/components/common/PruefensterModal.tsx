import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Dossier } from '../../types';
import { Checkbox, TextArea, Button, Select } from './FormControls';
import { useToast } from '../../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateDossierInProgress, verifyDossier, rejectDossier } from '../../store/verificationSlice';

// Import the users directly from the mock data to access their initials
import { users } from '../../mocks/handlers';

interface PruefensterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: Dossier;
  onVerify?: (dossierId: string) => void;
  onReject?: (dossierId: string) => void;
}

export const PruefensterModal: React.FC<PruefensterModalProps> = ({
  isOpen,
  onClose,
  dossier,
  onVerify,
  onReject
}) => {
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector(state => state.verification.currentUserId);
  
  // Get the current user's initials (the verifier, not the case owner)
  const getCurrentUserInitials = (): string => {
    // Try to get the current user from the mock data
    try {
      // @ts-ignore - Access to the users array
      const currentUser = users.find(u => u.id === currentUserId);
      if (currentUser && currentUser.initials) {
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
  
  // Add a local state for current status
  const [currentStatus, setCurrentStatus] = useState<'in-progress' | 'not-verified' | 'verified'>(
    dossier.status || (dossier.isVerified ? 'verified' : 'not-verified')
  );
  
  const ratingOptions = [
    { value: 'NOT_FULFILLED', label: '🟥 Überwiegend nicht erfüllt' },
    { value: 'PARTIALLY_FULFILLED', label: '🟧 Teilweise nicht erfüllt' },
    { value: 'MOSTLY_FULFILLED', label: '🟨 Überwiegend erfüllt' },
    { value: 'SUCCESSFULLY_FULFILLED', label: '🟩 Erfolgreich erfüllt' },
    { value: 'EXCELLENTLY_FULFILLED', label: '🟢 Ausgezeichnet erfüllt' },
  ];

  const specialFindingsOptions = [
    { value: 'feedback', label: 'Kundenfeedback über ausgezeichnete Bearbeitung' },
    { value: 'communication', label: 'Optimale Kundenkommunikation' },
    { value: 'aboveAverage', label: 'Überdurchschnittliche Leistung im Regress oder zur Schadenvermeidung' },
    { value: 'negotiation', label: 'Besonderes Verhandlungsgeschick' },
    { value: 'timeliness', label: 'Perfekte zeitliche und inhaltliche Bearbeitung' },
  ];

  const detailedFindingsOptions = [
    { value: 'SR01', label: 'Relevanter Sachverhalt nicht plausibel dargestellt.' },
    { value: 'SR02', label: 'Liefer-/Vertragsbedingungen nicht erfasst.' },
    { value: 'SR03', label: 'Deckungssumme nicht korrekt erfasst.' },
    { value: 'SR04', label: 'Zusatzdeckungen nicht berücksichtigt.' },
    { value: 'SR05', label: 'Entschädigungsabrechnung nicht fristgerecht.' },
    { value: 'SR06', label: 'Falsche oder keine Inkassomassnahmen.' },
    { value: 'SR07', label: 'Regressmassnahmen falsch beurteilt.' },
    { value: 'SR08', label: 'Kostenrisiko rechtlicher Beitreibung falsch eingeschätzt.' },
    { value: 'SR09', label: 'BPR nicht richtig instruiert.' },
    { value: 'SR10', label: 'Kommunikation mit VN verbesserungswürdig.' },
  ];
  
  const [comment, setComment] = useState(dossier.comment || '');
  const [rating, setRating] = useState<Dossier['rating']>(dossier.rating || '');
  const [verifier, setVerifier] = useState('');
  const [selectedFindings, setSelectedFindings] = useState<Record<string, boolean>>(
    () => {
      // Initialize with all options set to false by default if not present
      const initialValues = {...(dossier.specialFindings || {})};
      specialFindingsOptions.forEach(opt => {
        if (initialValues[opt.value] === undefined) {
          initialValues[opt.value] = false;
        }
      });
      return initialValues;
    }
  );
  
  const [selectedDetailedFindings, setSelectedDetailedFindings] = useState<Record<string, boolean>>(
    () => {
      // Initialize with all options set to false by default if not present
      const initialValues = {...(dossier.detailedFindings || {})};
      detailedFindingsOptions.forEach(opt => {
        if (initialValues[opt.value] === undefined) {
          initialValues[opt.value] = false;
        }
      });
      return initialValues;
    }
  );

  // Load initial values from dossier (including any in-progress data)
  useEffect(() => {
    if (dossier) {
      setComment(dossier.comment || '');
      setRating(dossier.rating || '');
      
      // If the dossier already has a verifier, use that
      // Otherwise, use the current user's initials
      if (dossier.verifier && dossier.verifier.length > 0) {
        console.log('Using existing verifier:', dossier.verifier);
        setVerifier(dossier.verifier);
      } else {
        // Use the current user's initials as the verifier
        const currentUserInitials = getCurrentUserInitials();
        console.log('Setting verifier to current user initials:', currentUserInitials);
        setVerifier(currentUserInitials);
      }
      
      // Update the current status based on dossier
      setCurrentStatus(dossier.status || (dossier.isVerified ? 'verified' : 'not-verified'));
      
      // Update findings with all options set to false by default
      const updatedSpecialFindings = {...(dossier.specialFindings || {})};
      specialFindingsOptions.forEach(opt => {
        if (updatedSpecialFindings[opt.value] === undefined) {
          updatedSpecialFindings[opt.value] = false;
        }
      });
      setSelectedFindings(updatedSpecialFindings);
      
      // Update detailed findings with all options set to false by default
      const updatedDetailedFindings = {...(dossier.detailedFindings || {})};
      detailedFindingsOptions.forEach(opt => {
        if (updatedDetailedFindings[opt.value] === undefined) {
          updatedDetailedFindings[opt.value] = false;
        }
      });
      setSelectedDetailedFindings(updatedDetailedFindings);
    }
  }, [dossier, currentUserId]);

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setSelectedFindings(prev => ({ ...prev, [value]: checked }));
  };

  const handleDetailedChange = (value: string, checked: boolean) => {
    setSelectedDetailedFindings(prev => ({ ...prev, [value]: checked }));
  };

  // Handle rating change with the correct typing
  const handleRatingChange = (value: string) => {
    setRating(value as Dossier['rating']);
  };

  // Update the saveFormState function to change status to in-progress
  const saveFormState = () => {
    setCurrentStatus('in-progress');
    dispatch(updateDossierInProgress({
      dossierId: dossier.id,
      userId: dossier.userId,
      verifier,
      comment,
      rating,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    }));
    
    showToast('Verification data saved', 'info');
  };

  const handleVerify = () => {
    // Update current status
    setCurrentStatus('verified');
    
    // Update dossier with new values
    dossier.comment = comment;
    dossier.rating = rating;
    dossier.verifier = verifier;
    dossier.specialFindings = selectedFindings;
    dossier.detailedFindings = selectedDetailedFindings;
    
    // Dispatch the verifyDossier action directly to set isVerified to true and status to 'verified'
    dispatch(verifyDossier({
      dossierId: dossier.id,
      isVerified: true,
      userId: dossier.userId,
      verifier,
      comment,
      rating,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    }));
    
    // Then call the external onVerify handler
    onVerify && onVerify(dossier.id);
    showToast('Dossier erfolgreich genehmigt!', 'success');
    onClose();
  };

  const handleReject = () => {
    // Update current status
    setCurrentStatus('not-verified');
    
    // Update dossier with new values
    dossier.comment = comment;
    dossier.rating = rating;
    dossier.verifier = verifier;
    dossier.specialFindings = selectedFindings;
    dossier.detailedFindings = selectedDetailedFindings;
    
    // Dispatch the rejectDossier action directly
    dispatch(rejectDossier({
      dossierId: dossier.id,
      userId: dossier.userId,
      verifier,
      comment,
      rating,
      specialFindings: selectedFindings,
      detailedFindings: selectedDetailedFindings
    }));
    
    // Then call the external onReject handler
    onReject && onReject(dossier.id);
    showToast('Dossier wurde abgelehnt.', 'warning');
    onClose();
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
                  currentStatus === 'verified' ? 'var(--success-color)' : 
                  currentStatus === 'in-progress' ? '#f0ad4e' : /* warning color */
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
              {currentStatus === 'verified' ? 'Verifiziert' : 
               currentStatus === 'in-progress' ? 'In Bearbeitung' : 
               'Nicht Verifiziert'}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4>Verification Details</h4>
          <div className="form-group">
            <label htmlFor="verifier">Prüfer (Initialen)</label>
            <input
              type="text"
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
            color="danger"
            size="large"
          >
            Ablehnen
          </Button>
          <Button
            onClick={handleVerify}
            color="success"
            size="large"
            disabled={!verifier.trim()}
          >
            Genehmigen
          </Button>
          <Button
            onClick={saveFormState}
            color="primary"
            size="large"
          >
            Zwischenspeichern
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 