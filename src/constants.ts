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
  
  // Audit endpoints - Standardized and RESTful
  AUDITS: {
    BASE: '/audits',
    BY_ID: (id: string) => `/audits/${id}`,
    FINDINGS: (auditId: string) => `/audits/${auditId}/findings`,
    COMPLETION: (auditId: string) => `/audits/${auditId}/completion`,
    
    // Query parameter-based filtering (more RESTful)
    // Usage: /audits?quarter=Q1-2024
    BY_QUARTER: '/audits',
    // Usage: /audits?auditor={auditorId}
    BY_AUDITOR: '/audits',
  },
  
  // Quarterly audit selection endpoints - Resource-based approach
  QUARTERLY_SELECTIONS: {
    BASE: '/quarterly-selections',
    BY_PERIOD: (period: string) => `/quarterly-selections/${period}`,
  },
  
  // Audit findings endpoints (separate resource for complex finding operations)
  AUDIT_FINDINGS: {
    BASE: '/audit-findings',
    BY_AUDIT_ID: (auditId: string) => `/audit-findings?auditId=${auditId}`,
  },
  
  // Pre-loaded cases endpoint
  PRE_LOADED_CASES: '/pre-loaded-cases',
  

} as const;

// =============================================================================
// REST API Enhancement Constants for 100% Compliance
// =============================================================================

export const PROBLEM_TYPES = {
  VALIDATION_ERROR: 'urn:audit-tool:problems:validation-error',
  BUSINESS_LOGIC_ERROR: 'urn:audit-tool:problems:business-logic-error',
  RESOURCE_NOT_FOUND: 'urn:audit-tool:problems:resource-not-found',
  RESOURCE_CONFLICT: 'urn:audit-tool:problems:resource-conflict',
  AUTHENTICATION_ERROR: 'urn:audit-tool:problems:authentication-error',
  AUTHORIZATION_ERROR: 'urn:audit-tool:problems:authorization-error',
  RATE_LIMIT_EXCEEDED: 'urn:audit-tool:problems:rate-limit-exceeded',
  INTERNAL_ERROR: 'urn:audit-tool:problems:internal-error'
} as const;

export const REST_STATUS_MESSAGES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable'
} as const;