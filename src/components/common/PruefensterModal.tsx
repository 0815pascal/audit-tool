import React, { useState } from 'react';
import { Modal } from './Modal';
import { ClaimInformation } from '../verification/InvoiceDetails';
import { VerifiedInvoice } from '../verified-invoices/types';
import { Checkbox, TextArea, Button, Select } from './FormControls';

interface PruefensterModalProps {
  isOpen: boolean;
  invoice?: VerifiedInvoice | null;
  onClose: () => void;
}

export const PruefensterModal: React.FC<PruefensterModalProps> = ({ isOpen, invoice, onClose }) => {
  // Local state for inputs
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<string>('');
  const ratingOptions = [
    { value: 'notMet', label: '🟥 Überwiegend nicht erfüllt' },
    { value: 'partiallyMet', label: '🟧 Teilweise nicht erfüllt' },
    { value: 'mostlyMet', label: '🟨 Überwiegend erfüllt' },
    { value: 'fulfilled', label: '🟩 Erfolgreich erfüllt' },
    { value: 'excellent', label: '🟢 Ausgezeichnet erfüllt' },
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
  const [selectedFindings, setSelectedFindings] = useState<Record<string, boolean>>( 
    () => specialFindingsOptions.reduce((acc, opt) => ({ ...acc, [opt.value]: false }), {})
  );
  const [selectedDetailedFindings, setSelectedDetailedFindings] = useState<Record<string, boolean>>(
    () => detailedFindingsOptions.reduce((acc, opt) => ({ ...acc, [opt.value]: false }), {})
  );
  const handleCheckboxChange = (value: string, checked: boolean) => {
    setSelectedFindings(prev => ({ ...prev, [value]: checked }));
  };
  const handleDetailedChange = (value: string, checked: boolean) => {
    setSelectedDetailedFindings(prev => ({ ...prev, [value]: checked }));
  };
  const handleSave = () => {
    // TODO: implement save logic
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Prüffenster" onClose={onClose}>
      {!invoice ? (
        <p>No invoice selected.</p>
      ) : (
        <div>
          {/* Show claim metadata */}
          <ClaimInformation invoice={invoice} />

          <h4>Freitext</h4>
          <TextArea
            id="pruefenster-comment"
            label="Kommentar"
            value={comment}
            onChange={setComment}
            rows={4}
          />

          <h4>Prüfergebnis</h4>
          <Select
            id="pruefenster-rating"
            options={ratingOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            value={rating}
            onChange={setRating}
          />

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.5rem' }}>
            <Button onClick={handleSave} color="primary">Speichern</Button>
            <Button onClick={onClose} color="text">Abbrechen</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}; 