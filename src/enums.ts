/**
 * Centralized enums file for type-safe constants
 * 
 * This file contains all the enum types used throughout the application.
 * By centralizing these in a separate file, we avoid circular dependencies
 * between types.ts and constants.ts.
 */

// Detailed Finding Types enum
export enum DETAILED_FINDING_ENUM {
  FACTS_INCORRECT = 'facts_incorrect',
  TERMS_INCORRECT = 'terms_incorrect',
  COVERAGE_INCORRECT = 'coverage_incorrect',
  ADDITIONAL_COVERAGE_MISSED = 'additional_coverage_missed',
  DECISION_NOT_COMMUNICATED = 'decision_not_communicated',
  COLLECTION_INCORRECT = 'collection_incorrect',
  RECOURSE_WRONG = 'recourse_wrong',
  COST_RISK_WRONG = 'cost_risk_wrong',
  BPR_WRONG = 'bpr_wrong',
  COMMUNICATION_POOR = 'communication_poor'
}

// Special Finding Types enum
export enum SPECIAL_FINDING_ENUM {
  FEEDBACK = 'feedback',
  COMMUNICATION = 'communication',
  RECOURSE = 'recourse',
  NEGOTIATION = 'negotiation',
  PERFECT_TIMING = 'perfect_timing'
}

// HTTP methods enum
export enum HTTP_METHOD {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// Case status enum
export enum CASE_STATUS_ENUM {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPENSATED = 'COMPENSATED',
  CLOSED = 'CLOSED'
}

// Claims status enum
export enum CLAIMS_STATUS_ENUM {
  FULL_COVER = 'FULL_COVER',
  PARTIAL_COVER = 'PARTIAL_COVER',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING'
}

// Action status enum
export enum ACTION_STATUS_ENUM {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed'
}

// Audit status enum
export enum AUDIT_STATUS_ENUM {
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  COMPLETED = 'completed'
}

// Button color enum for form controls
export enum BUTTON_COLOR {
  PRIMARY = 'primary',
  SUCCESS = 'success',
  DANGER = 'danger',
  INFO = 'info',
  TEXT = 'text'
}

// Button size enum for form controls
export enum BUTTON_SIZE {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

// User role enum
export enum USER_ROLE_ENUM {
  STAFF = 'STAFF',
  SPECIALIST = 'SPECIALIST',
  TEAM_LEADER = 'TEAM_LEADER',
  READER = 'READER'
}

// Case type enum
export enum CASE_TYPE_ENUM {
  USER_QUARTERLY = 'USER_QUARTERLY',
  PREVIOUS_QUARTER_RANDOM = 'PREVIOUS_QUARTER_RANDOM',
  QUARTER_DISPLAY = 'QUARTER_DISPLAY', // For displaying all cases in a quarter
  PRE_LOADED = 'PRE_LOADED' // For cases that appear on initial load but don't affect auto-selection
}

// Rating value enum
export enum RATING_VALUE_ENUM {
  NOT_FULFILLED = 'NOT_FULFILLED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  MOSTLY_FULFILLED = 'MOSTLY_FULFILLED',
  SUCCESSFULLY_FULFILLED = 'SUCCESSFULLY_FULFILLED',
  EXCELLENTLY_FULFILLED = 'EXCELLENTLY_FULFILLED',
  EMPTY = ''
}

// Input type enum for form controls
export enum INPUT_TYPE_ENUM {
  CHECKBOX = 'checkbox',
}

// Default values enum
export enum DEFAULT_VALUE_ENUM {
  DEFAULT_POLICY_ID = 10000,
  SAMPLE_POLICY_ID = 12345,
  DEFAULT_CASE_NUMBER = 30000000,
  CASE_NUMBER_RANGE = 1000000
}

export enum Department {
  Admin = 'Admin', 
  Claims = 'Claims',
}