import {
  DETAILED_FINDING_ENUM,
  SPECIAL_FINDING_ENUM,
} from '../enums';

// Import the types we need for the helper functions
import type {
  QuarterPeriod,
  QuarterNumber,
  FindingsRecord,
  DetailedFindingsRecord,
  SpecialFindingsRecord,
  ISODateString,
} from './types';
import type {
  CaseAuditId,
  UserId,
  CaseId,
  PolicyId,
  ValidYear,
} from './brandedTypes';

// Utility function to check if a value is a CaseAuditId
// Create a CaseAuditId from a string
export function createCaseAuditId(id: string): CaseAuditId {
  return id as CaseAuditId;
}

// Ensure a value is a CaseAuditId
export function ensureCaseAuditId(id: string | CaseAuditId): CaseAuditId {
  return typeof id === 'string' ? createCaseAuditId(id) : id;
}

/**
 * Create a date string in ISO format with type safety
 */
export function createISODateString(date: Date = new Date()): ISODateString {
  return date.toISOString() as ISODateString;
}

/**
 * Type guard to check if a string is a valid QuarterPeriod
 */
export function isQuarterPeriod(value: string): value is QuarterPeriod {
  if (!/^Q[1-4]-\d{4}$/.test(value)) {
    return false;
  }
  
  const [quarterPart, yearPart] = value.split('-');
  const quarterNum = parseInt(quarterPart.substring(1));
  const year = parseInt(yearPart);
  
  return (
    quarterNum >= 1 && 
    quarterNum <= 4 && 
    year >= 2000 && 
    year <= 2100
  );
}

export function isValidYear(year: number): year is ValidYear {
  return year >= 2000 && year <= 2100;
}

export function createValidYear(year: number): ValidYear {
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}. Must be between 2000 and 2100.`);
  }
  return year;
}

// Helper functions for creating branded types
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createCaseId(id: number): CaseId {
  return id as CaseId;
}

export function createPolicyId(id: number): PolicyId {
  return id as PolicyId;
}

// Improved shorthand helper functions for common ID types
export function ensureUserId(id: string | UserId): UserId {
  return typeof id === 'string' ? createUserId(id) : id;
}

// Type-safe helper functions
export const createEmptyFindings = (): FindingsRecord => {
  return {
    [DETAILED_FINDING_ENUM.FACTS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.TERMS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.COVERAGE_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED]: false,
    [DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED]: false,
    [DETAILED_FINDING_ENUM.COLLECTION_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.RECOURSE_WRONG]: false,
    [DETAILED_FINDING_ENUM.COST_RISK_WRONG]: false,
    [DETAILED_FINDING_ENUM.BPR_WRONG]: false,
    [DETAILED_FINDING_ENUM.COMMUNICATION_POOR]: false,
    [SPECIAL_FINDING_ENUM.FEEDBACK]: false,
    [SPECIAL_FINDING_ENUM.COMMUNICATION]: false,
    [SPECIAL_FINDING_ENUM.RECOURSE]: false,
    [SPECIAL_FINDING_ENUM.NEGOTIATION]: false,
    [SPECIAL_FINDING_ENUM.PERFECT_TIMING]: false
  };
};

// Helper to create just detailed findings
export const createEmptyDetailedFindings = (): DetailedFindingsRecord => {
  return {
    [DETAILED_FINDING_ENUM.FACTS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.TERMS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.COVERAGE_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED]: false,
    [DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED]: false,
    [DETAILED_FINDING_ENUM.COLLECTION_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.RECOURSE_WRONG]: false,
    [DETAILED_FINDING_ENUM.COST_RISK_WRONG]: false,
    [DETAILED_FINDING_ENUM.BPR_WRONG]: false,
    [DETAILED_FINDING_ENUM.COMMUNICATION_POOR]: false
  };
};

// Helper to create just special findings
export const createEmptySpecialFindings = (): SpecialFindingsRecord => {
  return {
    [SPECIAL_FINDING_ENUM.FEEDBACK]: false,
    [SPECIAL_FINDING_ENUM.COMMUNICATION]: false,
    [SPECIAL_FINDING_ENUM.RECOURSE]: false,
    [SPECIAL_FINDING_ENUM.NEGOTIATION]: false,
    [SPECIAL_FINDING_ENUM.PERFECT_TIMING]: false
  };
};

// Helper to format a quarter period (Q1-2023 format)
export function formatQuarterPeriod(quarter: QuarterNumber, year: number): QuarterPeriod {
  return `Q${quarter}-${year}`;
}

/**
 * Convert a generic Record<string, boolean> to a FindingsRecord
 * This ensures all required enum properties are present by merging with empty findings
 */
export function convertToFindingsRecord(apiFindings?: Record<string, boolean>): FindingsRecord {
  const emptyFindings = createEmptyFindings();
  
  if (!apiFindings) {
    return emptyFindings;
  }
  
  // Merge API findings with empty findings, ensuring only valid enum keys are used
  const validFindings: Partial<FindingsRecord> = {};
  
  Object.entries(apiFindings).forEach(([key, value]) => {
    if (key in emptyFindings) {
      (validFindings as Record<string, boolean>)[key] = value;
    }
  });
  
  return { ...emptyFindings, ...validFindings };
} 