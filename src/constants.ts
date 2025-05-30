import {
  ClaimsStatus
} from './types/types';
import { CASE_STATUS_ENUM, CLAIMS_STATUS_ENUM, ACTION_STATUS_ENUM } from './enums';

import {
  USER_ROLE_ENUM,
  CASE_TYPE_ENUM,
  TAB_VIEW_ENUM
} from './enums';

import {
  CaseType,
  FindingType,
  DetailedFindingType,
  SpecialFindingType,
  ActionStatus
} from './types/types';

// Claims status options 
export const CLAIMS_STATUS: Record<ClaimsStatus, ClaimsStatus> = {
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

// Export as CASE_STATUS for backward compatibility
export const CASE_STATUS = CASE_STATUS_MAPPING;

// Case types
export const CASE_TYPES: Record<CaseType, CaseType> = {
  [CASE_TYPE_ENUM.USER_QUARTERLY]: CASE_TYPE_ENUM.USER_QUARTERLY,
  [CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM]: CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM
};

// Tab views
export const TAB_VIEWS = {
  AUDIT_LOG: TAB_VIEW_ENUM.AUDIT_LOG,
  IKS: TAB_VIEW_ENUM.IKS,
  USERS: TAB_VIEW_ENUM.USERS
};

// Tab view display names
export const TAB_VIEWS_DISPLAY: Record<TAB_VIEW_ENUM, string> = {
  [TAB_VIEW_ENUM.AUDIT_LOG]: "Audit Log",
  [TAB_VIEW_ENUM.IKS]: "IKS",
  [TAB_VIEW_ENUM.USERS]: "Users"
};

// Action status constants for async operations
export const ACTION_STATUS: Record<ActionStatus, ActionStatus> = {
  [ACTION_STATUS_ENUM.IDLE]: ACTION_STATUS_ENUM.IDLE,
  [ACTION_STATUS_ENUM.LOADING]: ACTION_STATUS_ENUM.LOADING,
  [ACTION_STATUS_ENUM.SUCCEEDED]: ACTION_STATUS_ENUM.SUCCEEDED,
  [ACTION_STATUS_ENUM.FAILED]: ACTION_STATUS_ENUM.FAILED
};
// Error messages - Centralizing for consistency
// Default values for various operations
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