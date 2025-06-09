import {createCaseId, QuarterNumber, QuarterPeriod} from '../types';
import { CURRENCY, ValidCurrency } from '../types/currencyTypes';
import {
  CASE_STATUS_MAPPING,
  CLAIMS_STATUS,
  QUARTER_CALCULATIONS
} from '../constants';
import {USER_ROLE_ENUM} from '../enums';
import {ApiAuditResponse, ApiCaseResponse} from './mockTypes';
import { users, extractNumericId } from './mockData';

// In-memory storage for created audits
export const auditStore = new Map<number, ApiAuditResponse>();

// Safely parse string to integer with fallback
export const safeParseInt = (value: string | number | undefined, fallback = 0): number => {
  const parsed = parseInt(String(value));
  return isNaN(parsed) ? fallback : parsed;
};

// Safely extract numeric part from string ID
export const getNumericId = (id: string | number | undefined): number => {
  return extractNumericId(id);
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
  const actualUserId = safeParseInt(caseItem.userId as string | number | undefined, 1);
  const actualCaseNumber = caseItem.caseNumber as number;
  
  // Ensure we have a valid case number - no more fallback generation
  if (!actualCaseNumber) {
    throw new Error('Case number is required in mock data');
  }
  
  // Find the actual user data to get their role
  const userData = users.find(u => u.id === `user-${actualUserId}`);
  const userRole = userData?.authorities ?? USER_ROLE_ENUM.STAFF;
  
  return {
    caseNumber: createCaseId(actualCaseNumber),
    claimOwner: {
      userId: actualUserId,
      role: userRole
    },
    claimStatus: (caseItem.claimStatus as typeof CLAIMS_STATUS.FULL_COVER) || CLAIMS_STATUS.FULL_COVER,
    coverageAmount: (caseItem.coverageAmount as number) || 0,
    caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
    notificationDate: (caseItem.notificationDate as string) || '',
    notifiedCurrency: (caseItem.notifiedCurrency as ValidCurrency) || CURRENCY.CHF
  };
};

// Utility to convert audited case data to API case format with audit information
export const caseToAuditedCaseObj = (caseItem: Record<string, unknown>): ApiCaseResponse & { 
  auditor?: string; 
  isCompleted?: boolean; 
  comment?: string; 
} => {
  const basicCase = caseToCaseObj(caseItem);
  
  return {
    ...basicCase,
    // Include audit information if available
    auditor: (caseItem.auditor as string) || '',
    isCompleted: Boolean(caseItem.isCompleted),
    comment: (caseItem.comment as string) || ''
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
      claimStatus: caseObj.claimStatus || CLAIMS_STATUS.FULL_COVER,
      coverageAmount: caseObj.coverageAmount || 0,
      notificationDate: caseObj.notificationDate,
      notifiedCurrency: caseObj.notifiedCurrency || CURRENCY.CHF
    },
    auditor: {
      userId: typeof caseObj.claimOwner?.userId === 'number' ? caseObj.claimOwner.userId : 2,
      role: caseObj.claimOwner?.role || USER_ROLE_ENUM.SPECIALIST
    }
  };
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