/**
 * Centralized enums file for type-safe constants
 * 
 * This file contains all the enum types used throughout the application.
 * By centralizing these in a separate file, we avoid circular dependencies
 * between types.ts and constants.ts.
 */

// Finding Categories enum
export enum FINDING_CATEGORY {
}

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

// HTTP status codes enum
export enum HTTP_STATUS_CODE {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

// Toast types enum
export enum TOAST_TYPE {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning'
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

// Quarterly status enum
export enum QUARTERLY_STATUS_ENUM {
  COMPLETED = 'completed',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress'
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
  PREVIOUS_QUARTER_RANDOM = 'PREVIOUS_QUARTER_RANDOM'
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

// Sort order enum for API queries
export enum SORT_ORDER_ENUM {
  ASCENDING = 'asc',
  DESCENDING = 'desc'
}

// Status display enum for boolean values
export enum STATUS_DISPLAY_ENUM {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  YES = 'Yes',
  NO = 'No',
  ENABLED = 'Enabled',
  DISABLED = 'Disabled'
}

// Input type enum for form controls
export enum INPUT_TYPE_ENUM {
  TEXT = 'text',
  NUMBER = 'number',
  PASSWORD = 'password',
  EMAIL = 'email',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  DATETIME = 'datetime-local',
  COLOR = 'color',
  FILE = 'file',
  HIDDEN = 'hidden',
  MONTH = 'month',
  RANGE = 'range',
  SEARCH = 'search',
  TEL = 'tel',
  TIME = 'time',
  URL = 'url',
  WEEK = 'week'
}

// Tab view enum for navigation
export enum TAB_VIEW_ENUM {
  AUDIT_LOG = 'auditLog',
  IKS = 'iks'
}

// Valid year ranges enum
export enum YEAR_LIMIT_ENUM {
  MIN = 2000,
  MAX = 2100
}

// Time constants enum (in milliseconds)
export enum TIME_MS_ENUM {
  ONE_MINUTE = 60 * 1000,
  ONE_HOUR = 60 * 60 * 1000,
  ONE_DAY = 24 * 60 * 60 * 1000,
  ONE_WEEK = 7 * 24 * 60 * 60 * 1000,
  TOAST_DURATION = 3000
}

// Default values enum
export enum DEFAULT_VALUE_ENUM {
  RISK_SCORE = 1,
  EMPTY_USER_ID = 0,
  TEAM_LEADER_ID = '4',
  DEFAULT_POLICY_ID = 10000,
  SAMPLE_POLICY_ID = 12345,
  DEFAULT_CASE_NUMBER = 30000000,
  CASE_NUMBER_RANGE = 1000000
}

// Locale and formatting constants
export enum LOCALE_ENUM {
  SWISS_GERMAN = 'de-CH',
  CURRENCY_CODE = 'CHF'
}

// Quarter enum
export enum QUARTER_ENUM {
  Q1 = 1,
  Q2 = 2,
  Q3 = 3,
  Q4 = 4
}

// Quarter start month enum (0-indexed months)
export enum QUARTER_START_MONTH_ENUM {
  Q1 = 0,  // January
  Q2 = 3,  // April
  Q3 = 6,  // July
  Q4 = 9   // October
}

// Error type enum for categorizing error messages
export enum ERROR_TYPE_ENUM {
  VALIDATION = 'validation',
  API = 'api',
  FETCH = 'fetch',
  UNKNOWN = 'unknown'
}

// CSS color classes for toast background colors
export enum TOAST_BG_COLOR_ENUM {
  SUCCESS = 'bg-green-500',
  ERROR = 'bg-red-500',
  WARNING = 'bg-yellow-500',
  INFO = 'bg-blue-500'
}

// CSS color constants for UI components
export enum UI_COLOR_ENUM {
  PRIMARY = 'var(--primary-color)',
  SUCCESS = 'var(--success-color)',
  DANGER = '#d24723',
  INFO = '#00008f',
  WHITE = 'white',
  TRANSPARENT = 'transparent',
  BORDER = '#ccc'
}

// CSS text alignment classes
export enum TEXT_ALIGN_ENUM {
  LEFT = 'text-left',
  CENTER = 'text-center',
  RIGHT = 'text-right',
  JUSTIFY = 'text-justify'
} 

export enum Department {
  Admin = 'Admin', Claims = 'Claims',
}