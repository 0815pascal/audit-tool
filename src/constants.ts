import { 
  CASE_STATUS_ENUM, 
  CLAIMS_STATUS_ENUM, 
  ACTION_STATUS_ENUM, 
  USER_ROLE_ENUM,
  CASE_TYPE_ENUM,
  DETAILED_FINDING_ENUM
} from './enums';

// API configuration
export const API_BASE_PATH = '/rest/kuk/v1';

// Claims status options 
export const CLAIMS_STATUS: Record<CLAIMS_STATUS_ENUM, CLAIMS_STATUS_ENUM> = {
  [CLAIMS_STATUS_ENUM.FULL_COVER]: CLAIMS_STATUS_ENUM.FULL_COVER,
  [CLAIMS_STATUS_ENUM.PARTIAL_COVER]: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
  [CLAIMS_STATUS_ENUM.DECLINED]: CLAIMS_STATUS_ENUM.DECLINED,
  [CLAIMS_STATUS_ENUM.PENDING]: CLAIMS_STATUS_ENUM.PENDING
};

// Case status options
export const CASE_STATUS_MAPPING = {
  [CASE_STATUS_ENUM.OPEN]: CASE_STATUS_ENUM.OPEN,
  [CASE_STATUS_ENUM.IN_PROGRESS]: CASE_STATUS_ENUM.IN_PROGRESS,
  [CASE_STATUS_ENUM.COMPENSATED]: CASE_STATUS_ENUM.COMPENSATED,
  [CASE_STATUS_ENUM.CLOSED]: CASE_STATUS_ENUM.CLOSED
};

// Case types
export const CASE_TYPES: Record<CASE_TYPE_ENUM, CASE_TYPE_ENUM> = {
  [CASE_TYPE_ENUM.USER_QUARTERLY]: CASE_TYPE_ENUM.USER_QUARTERLY,
  [CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM]: CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM,
  [CASE_TYPE_ENUM.QUARTER_DISPLAY]: CASE_TYPE_ENUM.QUARTER_DISPLAY,
  [CASE_TYPE_ENUM.PRE_LOADED]: CASE_TYPE_ENUM.PRE_LOADED
};

// Action status constants for async operations
export const ACTION_STATUS: Record<ACTION_STATUS_ENUM, ACTION_STATUS_ENUM> = {
  [ACTION_STATUS_ENUM.IDLE]: ACTION_STATUS_ENUM.IDLE,
  [ACTION_STATUS_ENUM.LOADING]: ACTION_STATUS_ENUM.LOADING,
  [ACTION_STATUS_ENUM.SUCCEEDED]: ACTION_STATUS_ENUM.SUCCEEDED,
  [ACTION_STATUS_ENUM.FAILED]: ACTION_STATUS_ENUM.FAILED
};

// Finding types - Split into detailed and special findings
export const DETAILED_FINDING_TYPES: Record<DETAILED_FINDING_ENUM, string> = {
  [DETAILED_FINDING_ENUM.FACTS_INCORRECT]: "Facts incorrect",
  [DETAILED_FINDING_ENUM.TERMS_INCORRECT]: "Terms incorrect",
  [DETAILED_FINDING_ENUM.COVERAGE_INCORRECT]: "Coverage incorrect",
  [DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED]: "Additional coverage missed",
  [DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED]: "Decision not communicated",
  [DETAILED_FINDING_ENUM.COLLECTION_INCORRECT]: "Collection incorrect",
  [DETAILED_FINDING_ENUM.RECOURSE_WRONG]: "Recourse wrong",
  [DETAILED_FINDING_ENUM.COST_RISK_WRONG]: "Cost risk wrong",
  [DETAILED_FINDING_ENUM.BPR_WRONG]: "BPR wrong",
  [DETAILED_FINDING_ENUM.COMMUNICATION_POOR]: "Communication poor"
};

// Form field validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Dieses Feld ist erforderlich',
  INVALID_EMAIL: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
  INVALID_PASSWORD: 'Das Passwort muss mindestens 8 Zeichen haben',
  PASSWORDS_MUST_MATCH: 'Die Passwörter müssen übereinstimmen',
  INVALID_USER_ROLE: 'Ungültige Benutzerrolle',
  CASE_NOT_FOUND: 'Fall nicht gefunden',
  AUDIT_COMPLETION_FAILED: 'Prüfung konnte nicht abgeschlossen werden'
} as const;

// Coverage amount limits by user role
export const COVERAGE_LIMITS = {
  [USER_ROLE_ENUM.STAFF]: 30000,
  [USER_ROLE_ENUM.SPECIALIST]: 150000,
  [USER_ROLE_ENUM.TEAM_LEADER]: 150000, // Same as specialist
  DEFAULT: 10000
};

// Quarter calculation constants
export const QUARTER_CALCULATIONS = {
  MONTHS_PER_QUARTER: 3,
  QUARTER_OFFSET: 1,
  MIN_QUARTER: 1,
  MAX_QUARTER: 4,
  RANDOM_DAY_LIMIT: 28
};

// API Endpoints - Centralized endpoint paths following REST conventions
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    CURRENT_USER: '/auth/current-user',
  },
  
  // User management endpoints
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    STATUS: (id: string) => `/users/${id}/status`,
    ROLE: (id: string) => `/users/${id}/role`,
  },
  
  // Audit endpoints
  AUDITS: {
    BASE: '/audits',
    BY_ID: (id: string) => `/audits/${id}`,
    BY_QUARTER: (quarter: string) => `/audits/quarter/${quarter}`,
    BY_AUDITOR: (auditorId: string) => `/audits/auditor/${auditorId}`,
    FINDINGS: (auditId: string) => `/audits/${auditId}/findings`,
  },
  
  // Audit completion endpoints
  AUDIT_COMPLETION: {
    BY_ID: (auditId: string) => `/audit-completion/${auditId}`,
    SELECT_QUARTERLY: '/audit-completion/select-quarterly',
    SELECT_QUARTERLY_BY_PERIOD: (period: string) => `/audit-completion/select-quarterly/${period}`,
    COMPLETE: (auditId: string) => `/audit/${auditId}/complete`,
  },
  
  // Audit findings endpoints
  AUDIT_FINDINGS: {
    BY_AUDIT_ID: (auditId: string) => `/audit-findings/${auditId}`,
  },
  
  // Pre-loaded cases endpoint
  PRE_LOADED_CASES: '/pre-loaded-cases',
} as const;