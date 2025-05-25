import {
  TOAST_TYPE,
  ACTION_STATUS_ENUM,
  CASE_STATUS_ENUM,
  CLAIMS_STATUS_ENUM,
  VERIFICATION_STATUS_ENUM,
  USER_ROLE_ENUM,
  CASE_TYPE_ENUM,
  RATING_VALUE_ENUM,
  YEAR_LIMIT_ENUM,
  TIME_MS_ENUM,
  DEFAULT_VALUE_ENUM,
  QUARTER_ENUM,
  QUARTER_START_MONTH_ENUM,
  DATE_FORMAT_ENUM,
  ERROR_TYPE_ENUM,
  LOCALE_ENUM
} from './enums';

// Import from types (not circular since types now import from enums.ts)
import { TabView } from './components/TabNavigationTypes';
import {
  ClaimsStatus,
  CaseStatus,
  CaseType,
  UserRole,
  FindingType,
  DetailedFindingType,
  SpecialFindingType,
  RatingValue,
  ToastType,
  VerificationStatus,
  QuarterNumber,
  ActionStatus,
} from './types';

// Claims status options 
export const CLAIMS_STATUS: Record<ClaimsStatus, ClaimsStatus> = {
  [CLAIMS_STATUS_ENUM.FULL_COVER]: CLAIMS_STATUS_ENUM.FULL_COVER,
  [CLAIMS_STATUS_ENUM.PARTIAL_COVER]: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
  [CLAIMS_STATUS_ENUM.DECLINED]: CLAIMS_STATUS_ENUM.DECLINED,
  [CLAIMS_STATUS_ENUM.PENDING]: CLAIMS_STATUS_ENUM.PENDING
};

// Human-readable display names
export const CLAIMS_STATUS_DISPLAY: Record<ClaimsStatus, string> = {
  [CLAIMS_STATUS_ENUM.FULL_COVER]: "Full cover",
  [CLAIMS_STATUS_ENUM.PARTIAL_COVER]: "Partial cover",
  [CLAIMS_STATUS_ENUM.DECLINED]: "Declined",
  [CLAIMS_STATUS_ENUM.PENDING]: "Pending"
};

// Case status options
export const CASE_STATUS: Record<CaseStatus, CaseStatus> = {
  [CASE_STATUS_ENUM.OPEN]: CASE_STATUS_ENUM.OPEN,
  [CASE_STATUS_ENUM.IN_PROGRESS]: CASE_STATUS_ENUM.IN_PROGRESS,
  [CASE_STATUS_ENUM.COMPENSATED]: CASE_STATUS_ENUM.COMPENSATED,
  [CASE_STATUS_ENUM.REJECTED]: CASE_STATUS_ENUM.REJECTED,
  [CASE_STATUS_ENUM.CLOSED]: CASE_STATUS_ENUM.CLOSED
};

export const CASE_STATUS_DISPLAY: Record<CaseStatus, string> = {
  [CASE_STATUS_ENUM.OPEN]: "Open",
  [CASE_STATUS_ENUM.IN_PROGRESS]: "In Progress",
  [CASE_STATUS_ENUM.COMPENSATED]: "Compensated",
  [CASE_STATUS_ENUM.REJECTED]: "Rejected", 
  [CASE_STATUS_ENUM.CLOSED]: "Closed"
};

// Case types
export const CASE_TYPES: Record<CaseType, CaseType> = {
  [CASE_TYPE_ENUM.USER_QUARTERLY]: CASE_TYPE_ENUM.USER_QUARTERLY,
  [CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM]: CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM
};

export const CASE_TYPES_DISPLAY: Record<CaseType, string> = {
  [CASE_TYPE_ENUM.USER_QUARTERLY]: "User Quarterly",
  [CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM]: "Previous Quarter Random"
};

// User roles
export const USER_ROLES: Record<UserRole, UserRole> = {
  [USER_ROLE_ENUM.STAFF]: USER_ROLE_ENUM.STAFF,
  [USER_ROLE_ENUM.SPECIALIST]: USER_ROLE_ENUM.SPECIALIST,
  [USER_ROLE_ENUM.TEAM_LEADER]: USER_ROLE_ENUM.TEAM_LEADER,
  [USER_ROLE_ENUM.READER]: USER_ROLE_ENUM.READER
};

export const USER_ROLES_DISPLAY: Record<UserRole, string> = {
  [USER_ROLE_ENUM.STAFF]: "Staff",
  [USER_ROLE_ENUM.SPECIALIST]: "Specialist",
  [USER_ROLE_ENUM.TEAM_LEADER]: "Team Leader",
  [USER_ROLE_ENUM.READER]: "Reader"
};

// Tab views
export const TAB_VIEWS = {
  AUDIT_LOG: TabView.AUDIT_LOG,
  IKS: TabView.IKS,
  USERS: TabView.USERS
};

// Tab view display names
export const TAB_VIEWS_DISPLAY: Record<TabView, string> = {
  [TabView.AUDIT_LOG]: "Audit Log",
  [TabView.IKS]: "IKS",
  [TabView.USERS]: "Users"
};

// Default user IDs - These should be converted to UserId using createUserId before use
export const DEFAULT_TEAM_LEADER_ID = DEFAULT_VALUE_ENUM.TEAM_LEADER_ID;

// Verification status values
export const VERIFICATION_STATUS: Record<VerificationStatus, VerificationStatus> = {
  [VERIFICATION_STATUS_ENUM.IN_PROGRESS]: VERIFICATION_STATUS_ENUM.IN_PROGRESS,
  [VERIFICATION_STATUS_ENUM.NOT_VERIFIED]: VERIFICATION_STATUS_ENUM.NOT_VERIFIED,
  [VERIFICATION_STATUS_ENUM.VERIFIED]: VERIFICATION_STATUS_ENUM.VERIFIED
};

export const VERIFICATION_STATUS_DISPLAY: Record<VerificationStatus, string> = {
  [VERIFICATION_STATUS_ENUM.IN_PROGRESS]: 'In Progress',
  [VERIFICATION_STATUS_ENUM.NOT_VERIFIED]: 'Not Verified',
  [VERIFICATION_STATUS_ENUM.VERIFIED]: 'Verified'
};

// Quarter numbers
export const QUARTERS: Record<QuarterNumber, QuarterNumber> = {
  [QUARTER_ENUM.Q1]: QUARTER_ENUM.Q1,
  [QUARTER_ENUM.Q2]: QUARTER_ENUM.Q2,
  [QUARTER_ENUM.Q3]: QUARTER_ENUM.Q3,
  [QUARTER_ENUM.Q4]: QUARTER_ENUM.Q4
};

// Quarter months mapping (1-indexed quarters to 0-indexed months)
export const QUARTER_START_MONTHS: Record<QuarterNumber, number> = {
  [QUARTER_ENUM.Q1]: QUARTER_START_MONTH_ENUM.Q1,
  [QUARTER_ENUM.Q2]: QUARTER_START_MONTH_ENUM.Q2,
  [QUARTER_ENUM.Q3]: QUARTER_START_MONTH_ENUM.Q3,
  [QUARTER_ENUM.Q4]: QUARTER_START_MONTH_ENUM.Q4
};

// Year constants
export const MIN_VALID_YEAR = YEAR_LIMIT_ENUM.MIN;
export const MAX_VALID_YEAR = YEAR_LIMIT_ENUM.MAX;

// Cache time constants
export const ONE_HOUR_MS = TIME_MS_ENUM.ONE_HOUR;
export const ONE_DAY_MS = TIME_MS_ENUM.ONE_DAY;
export const ONE_WEEK_MS = TIME_MS_ENUM.ONE_WEEK;

// Action status constants for async operations
export const ACTION_STATUS: Record<ActionStatus, ActionStatus> = {
  [ACTION_STATUS_ENUM.IDLE]: ACTION_STATUS_ENUM.IDLE,
  [ACTION_STATUS_ENUM.LOADING]: ACTION_STATUS_ENUM.LOADING,
  [ACTION_STATUS_ENUM.SUCCEEDED]: ACTION_STATUS_ENUM.SUCCEEDED,
  [ACTION_STATUS_ENUM.FAILED]: ACTION_STATUS_ENUM.FAILED
};

export const ACTION_STATUS_DISPLAY: Record<ActionStatus, string> = {
  [ACTION_STATUS_ENUM.IDLE]: 'Idle',
  [ACTION_STATUS_ENUM.LOADING]: 'Loading',
  [ACTION_STATUS_ENUM.SUCCEEDED]: 'Succeeded',
  [ACTION_STATUS_ENUM.FAILED]: 'Failed'
};

// Error messages - Centralizing for consistency
export const ERROR_MESSAGES = {
  [ERROR_TYPE_ENUM.VALIDATION]: {
    INVALID_VERIFICATION_STATUS: (status: string) => `Invalid verification status: ${status}. Using 'in_progress' instead.`,
    INVALID_YEAR: (year: number) => `Year ${year} is outside valid range. Using constrained value.`
  },
  [ERROR_TYPE_ENUM.FETCH]: {
    RANDOM_AUDIT: 'Error fetching random audit for user:',
    INITIAL_DATA: 'Error fetching initial data:',
    SELECT_USER: 'Error selecting user:',
    USER_CHANGE: 'Error in handleUserChange:',
    SELECT_AUDITS: (quarterKey: string) => `Error selecting audits for ${quarterKey}:`,
    UPDATE_STATUS: 'Error updating audit status:',
    VERIFY_AUDIT: 'Error verifying audit:',
    REJECT_AUDIT: 'Error rejecting audit:'
  },
  [ERROR_TYPE_ENUM.API]: {
    NON_ARRAY_DATA: 'API returned non-array data:',
    SELECT_AUDITS_FAILED: (quarterKey: string) => `Failed to select audits for ${quarterKey}`
  }
};

// Default values for various operations
export const DEFAULT_VALUES = {
  RISK_SCORE: DEFAULT_VALUE_ENUM.RISK_SCORE as number,
  EMPTY_USER_ID: DEFAULT_VALUE_ENUM.EMPTY_USER_ID as string,
  FALLBACK_AUDIT_ID: DEFAULT_VALUE_ENUM.FALLBACK_AUDIT_ID as string
};

// Finding types - Split into detailed and special findings
export const DETAILED_FINDING_TYPES: Record<DetailedFindingType, string> = {
  facts_incorrect: "Facts incorrect",
  terms_incorrect: "Terms incorrect",
  coverage_incorrect: "Coverage incorrect",
  additional_coverage_missed: "Additional coverage missed",
  decision_not_communicated: "Decision not communicated",
  collection_incorrect: "Collection incorrect",
  recourse_wrong: "Recourse wrong",
  cost_risk_wrong: "Cost risk wrong",
  bpr_wrong: "BPR wrong",
  communication_poor: "Communication poor"
};

export const SPECIAL_FINDING_TYPES: Record<SpecialFindingType, string> = {
  feedback: "Feedback",
  communication: "Communication",
  recourse: "Recourse",
  negotiation: "Negotiation",
  perfect_timing: "Perfect timing"
};

// Combined finding types for backwards compatibility
export const FINDING_TYPES: Record<FindingType | string, string> = {
  // Legacy keys that don't match the typed FindingType
  INCORRECT_FACT_ASSESSMENT: "Incorrect fact assessment",
  PROCEDURAL_ERROR: "Procedural error",
  DOCUMENTATION_ISSUE: "Documentation issue",
  // Typed finding keys
  ...DETAILED_FINDING_TYPES,
  ...SPECIAL_FINDING_TYPES
};

// Rating values
export const RATING_VALUES: Record<Exclude<RatingValue, ''>, string> = {
  [RATING_VALUE_ENUM.NOT_FULFILLED]: "Not Fulfilled",
  [RATING_VALUE_ENUM.PARTIALLY_FULFILLED]: "Partially Fulfilled",
  [RATING_VALUE_ENUM.MOSTLY_FULFILLED]: "Mostly Fulfilled",
  [RATING_VALUE_ENUM.SUCCESSFULLY_FULFILLED]: "Successfully Fulfilled",
  [RATING_VALUE_ENUM.EXCELLENTLY_FULFILLED]: "Excellently Fulfilled"
};

// Toast types
export const TOAST_TYPES: Record<ToastType, string> = {
  [TOAST_TYPE.SUCCESS]: "Success",
  [TOAST_TYPE.ERROR]: "Error",
  [TOAST_TYPE.INFO]: "Information",
  [TOAST_TYPE.WARNING]: "Warning"
};

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

// Locale and formatting constants
export const LOCALE_SETTINGS = {
  SWISS_GERMAN: LOCALE_ENUM.SWISS_GERMAN,
  CURRENCY_CODE: LOCALE_ENUM.CURRENCY_CODE
};

// Date formatting constants
export const DATE_FORMATTING = {
  ISO_DATE_SEPARATOR: DATE_FORMAT_ENUM.ISO_DATE_SEPARATOR,
  ISO_DATE_INDEX: DATE_FORMAT_ENUM.ISO_DATE_INDEX
};