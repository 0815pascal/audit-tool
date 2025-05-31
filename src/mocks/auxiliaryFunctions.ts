import {
  QuarterPeriod,
  QuarterNumber
} from '../types/types';
import {
  createCaseId,
  createValidYear
} from '../types/typeHelpers';
import { 
  CLAIMS_STATUS, 
  CASE_STATUS_MAPPING,
  DETAILED_FINDING_TYPES,
  SPECIAL_FINDING_TYPES,
  QUARTER_CALCULATIONS
} from '../constants';
import { Finding, createFindingId } from '../services/apiUtils';
import { USER_ROLE_ENUM } from '../enums';
import {ApiAuditResponse, ApiCaseResponse} from './mockTypes';

// In-memory storage for created audits
export const auditStore = new Map<number, ApiAuditResponse>();

// Safely parse string to integer with fallback
export const safeParseInt = (value: string | number | undefined, fallback = 0): number => {
  const parsed = parseInt(String(value));
  return isNaN(parsed) ? fallback : parsed;
};

// Safely extract numeric part from string ID
export const getNumericId = (id: string | number | undefined): number => {
  if (!id) return Math.floor(Math.random() * 1000) + 1;
  const matches = RegExp(/\d+/).exec(id.toString());
  return matches ? parseInt(matches[0]) : Math.floor(Math.random() * 1000) + 1;
};

// Parse quarter string (Q1-2023) to get quarter number and year
export const parseQuarter = (quarterStr: string): { quarterNum: number; year: number } | null => {
  if (!quarterStr) return null;
  
  try {
  // Handle both formats: "Q1-2023" and "Q1 2023"
  const match = RegExp(/Q(\d+)[\s-](\d{4})/).exec(quarterStr);
    if (!match) {
      // Try alternate format without Q prefix: "1-2023"
      const altMatch = RegExp(/(\d+)[\s-](\d{4})/).exec(quarterStr);
      if (!altMatch) return null;
      
      return {
        quarterNum: parseInt(altMatch[1]),
        year: parseInt(altMatch[2])
      };
    }
  
  return {
    quarterNum: parseInt(match[1]),
    year: parseInt(match[2])
  };
  } catch (error) {
    console.warn("Error parsing quarter string:", quarterStr, error);
    // Provide fallback values for current quarter
    const now = new Date();
    return {
      quarterNum: Math.floor(now.getMonth() / 3) + 1,
      year: now.getFullYear()
    };
  }
};

// Utility function to deduce quarter from notification date
export const getQuarterFromDate = (dateString: string): { quarterNum: number; year: number } => {
  const date = new Date(dateString);
  const month = date.getMonth(); // 0-indexed (0 = January, 11 = December)
  const year = date.getFullYear();
  const quarterNum = Math.floor(month / QUARTER_CALCULATIONS.MONTHS_PER_QUARTER) + QUARTER_CALCULATIONS.QUARTER_OFFSET; // Convert to 1-indexed quarter (1-4)
  
  return { quarterNum, year };
};

// Utility to convert our case data to the API case format
export const caseToCaseObj = (caseItem: Record<string, unknown>): ApiCaseResponse => {
  const numericId = getNumericId(caseItem.id as string | number | undefined);
  
  // Use the notificationDate from case data or create a realistic fallback
  const notificationDate = (caseItem.notificationDate as string) || new Date(
    createValidYear(2025),
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1
  ).toISOString().split('T')[0];
  
  return {
    caseNumber: createCaseId(numericId),
    claimOwner: {
      userId: numericId,
      role: USER_ROLE_ENUM.SPECIALIST
    },
    claimsStatus: (caseItem.claimsStatus as typeof CLAIMS_STATUS.FULL_COVER) || CLAIMS_STATUS.FULL_COVER,
    coverageAmount: (caseItem.coverageAmount as number) || 10000.00,
    caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
    notificationDate,
    notifiedCurrency: (caseItem.notifiedCurrency as string) || 'CHF'
  };
};

// Convert our case to API audit format
export const caseToAudit = (caseObj: ApiCaseResponse, quarter: QuarterPeriod): ApiAuditResponse => {
  const numericId = getNumericId(caseObj.caseNumber);
  return {
    auditId: numericId,
    quarter,
    caseObj: {
      ...caseObj,
      caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
      claimsStatus: caseObj.claimsStatus || CLAIMS_STATUS.FULL_COVER,
      coverageAmount: caseObj.coverageAmount || 10000.00,
      notificationDate: caseObj.notificationDate,
      notifiedCurrency: caseObj.notifiedCurrency || 'CHF'
    },
    auditor: {
      userId: typeof caseObj.claimOwner?.userId === 'number' ? caseObj.claimOwner.userId : 2,
      role: caseObj.claimOwner?.role || USER_ROLE_ENUM.SPECIALIST
    },
    isAkoReviewed: false
  };
};

// Generate realistic findings for an audit
export const generateFindings = (numericId: number): Finding[] => {
  const numFindings = Math.floor(Math.random() * 3) + 1; // 1-3 findings
  const findingTypes = [...Object.keys(DETAILED_FINDING_TYPES), ...Object.keys(SPECIAL_FINDING_TYPES)];
  
  return Array.from({ length: numFindings }, (_, i) => {
    const randomType = findingTypes[Math.floor(Math.random() * findingTypes.length)];
    const allFindingTypes = { ...DETAILED_FINDING_TYPES, ...SPECIAL_FINDING_TYPES };
    
    return {
      findingId: createFindingId(i + 1),
      type: randomType as keyof typeof allFindingTypes,
      description: `Sample finding ${i + 1} for audit ${numericId}: ${allFindingTypes[randomType as keyof typeof allFindingTypes]}`
    };
  });
};

// Calculate previous quarter info
export const getPreviousQuarterInfo = (quarterNum: number, year: number) => {
  let prevQuarterNum = quarterNum - 1;
  let prevYear = year;

  if (prevQuarterNum < 1) {
    prevQuarterNum = 4;
    prevYear--;
  }
  
  return {
    quarter: prevQuarterNum as QuarterNumber,
    year: prevYear
  };
}; 