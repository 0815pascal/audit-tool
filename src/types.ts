export interface User {
  id: string;
  name: string;
  middleName?: string;
  department: string;
  role: 'REGULAR' | 'SPECIALIST' | 'TEAM_LEADER';
  isActive: boolean;
  initials?: string;
}

export interface CalculationStep {
  id: string;
  description: string;
  value: number;
  isVerified: boolean;
  isIncorrect: boolean;
  comment: string;
}

export interface Dossier {
  id: string;
  userId: string;
  date: string;
  clientName: string;
  policyNumber: string;
  caseNumber: number;
  dossierRisk: number;
  dossierName: string;
  totalAmount: number;
  coverageAmount: number;
  isVerified: boolean;
  isAkoReviewed: boolean;
  isSpecialist: boolean;
  quarter: string;
  year: number;
  claimsStatus: 'FULL_COVER' | 'PARTIAL_COVER' | 'DECLINED' | 'PENDING';
  verifier: string;
  comment: string;
  rating: 'NOT_FULFILLED' | 'PARTIALLY_FULFILLED' | 'MOSTLY_FULFILLED' | 'SUCCESSFULLY_FULFILLED' | 'EXCELLENTLY_FULFILLED' | '';
  specialFindings: Record<string, boolean>;
  detailedFindings: Record<string, boolean>;
  caseType: 'USER_QUARTERLY' | 'PREVIOUS_QUARTER_RANDOM';
  status?: 'in-progress' | 'not-verified' | 'verified';
}

export interface VerificationFinding {
  id: string;
  label: string;
  category: 'detailed' | 'special';
}

export interface VerificationRating {
  id: string;
  label: string;
  color: string;
  value: string;
}

export const VERIFICATION_RATINGS: VerificationRating[] = [
  { id: 'not_fulfilled', label: 'Überwiegend nicht erfüllt', color: '#ff0000', value: 'NOT_FULFILLED' },
  { id: 'partially_fulfilled', label: 'Teilweise nicht erfüllt', color: '#ff9900', value: 'PARTIALLY_FULFILLED' },
  { id: 'mostly_fulfilled', label: 'Überwiegend erfüllt', color: '#ffff00', value: 'MOSTLY_FULFILLED' },
  { id: 'successfully_fulfilled', label: 'Erfolgreich erfüllt', color: '#00cc00', value: 'SUCCESSFULLY_FULFILLED' },
  { id: 'excellently_fulfilled', label: 'Ausgezeichnet erfüllt', color: '#009900', value: 'EXCELLENTLY_FULFILLED' }
];

export const DETAILED_FINDINGS: VerificationFinding[] = [
  { id: 'facts_incorrect', label: 'Der relevante Sachverhalt wurde nicht richtig abgeklärt oder ist nicht plausibel dargestellt', category: 'detailed' },
  { id: 'terms_incorrect', label: 'Die Liefer-/Vertragsbedingungen sind nicht richtig erfasst', category: 'detailed' },
  { id: 'coverage_incorrect', label: 'Die Deckungssumme ist nicht richtig erfasst', category: 'detailed' },
  { id: 'additional_coverage_missed', label: 'Zusatzdeckungen wurden nicht erkannt bzw. berücksichtigt', category: 'detailed' },
  { id: 'decision_not_communicated', label: 'Die Deckungsentscheidung und/oder die Entschädigungsabrechnung wurden nicht rechtzeitig mitgeteilt bzw. übersandt', category: 'detailed' },
  { id: 'collection_incorrect', label: 'Es wurden die falschen oder keine Inkassomassnahmen vorgenommen', category: 'detailed' },
  { id: 'recourse_wrong', label: 'Die Regressmöglichkeiten/-massnahmen wurden falsch beurteilt', category: 'detailed' },
  { id: 'cost_risk_wrong', label: 'Das Kostenrisiko bei der rechtlichen Forderungsbeitreibung wurde falsch eingeschätzt oder nicht richtig dargestellt', category: 'detailed' },
  { id: 'bpr_wrong', label: 'Der Business Partner Recovery (BPR) wurde nicht richtig instruiert', category: 'detailed' },
  { id: 'communication_poor', label: 'Die Kommunikation mit dem VN ist verbesserungswürdig oder dessen Interessen sind nicht hinreichend berücksichtigt', category: 'detailed' }
];

export const SPECIAL_FINDINGS: VerificationFinding[] = [
  { id: 'feedback', label: 'Kundenfeedback über ausgezeichnete Bearbeitung', category: 'special' },
  { id: 'communication', label: 'Optimale Kundenkommunikation', category: 'special' },
  { id: 'recourse', label: 'Überdurchschnittliche Leistung im Regress oder zur Schadenvermeidung', category: 'special' },
  { id: 'negotiation', label: 'Besonderes Verhandlungsgeschick', category: 'special' },
  { id: 'perfect_timing', label: 'Perfekte zeitliche und inhaltliche Bearbeitung', category: 'special' }
];