import { 
  ClaimsStatus, 
  QuarterPeriod,
  isQuarterPeriod,
  QuarterNumber,
  createCaseId,
  createUserId
} from '../types';
import { 
  CLAIMS_STATUS, 
  CASE_STATUS, 
  FINDING_TYPES,
  QUARTER_CALCULATIONS
} from '../constants';
import { USER_ROLE_ENUM, DEFAULT_VALUE_ENUM } from '../enums';
import {
  ApiCaseResponse,
  ApiAuditResponse,
  ApiFindingResponse
} from './mockTypes';

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
  const matches = id.toString().match(/\d+/);
  return matches ? parseInt(matches[0]) : Math.floor(Math.random() * 1000) + 1;
};

// Parse quarter string (Q1-2023) to get quarter number and year
export const parseQuarter = (quarterStr: string): { quarterNum: number; year: number } | null => {
  if (!quarterStr) return null;
  
  try {
  // Handle both formats: "Q1-2023" and "Q1 2023"
  const match = quarterStr.match(/Q(\d+)[\s-](\d{4})/);
    if (!match) {
      // Try alternate format without Q prefix: "1-2023"
      const altMatch = quarterStr.match(/(\d+)[\s-](\d{4})/);
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
export const caseToCaseObj = (caseData: Record<string, unknown>): ApiCaseResponse | null => {
  if (!caseData) return null;
  
  // Use the notificationDate from mock data, or create a realistic fallback
  const notificationDate = (caseData.notificationDate as string) || new Date().toISOString().split('T')[0];
  
  return {
    caseNumber: createCaseId(safeParseInt(caseData.caseNumber as string | number, 0)),
    claimOwner: {
      userId: typeof caseData.userId === 'string' 
        ? createUserId(caseData.userId) 
        : safeParseInt(caseData.userId as string, 1),
      role: USER_ROLE_ENUM.TEAM_LEADER
    },
    claimsStatus: caseData.claimsStatus as ClaimsStatus || CLAIMS_STATUS.FULL_COVER,
    coverageAmount: caseData.coverageAmount as number || (caseData.totalAmount as number) || 0,
    caseStatus: CASE_STATUS.COMPENSATED,
    notificationDate: notificationDate,
    notifiedCurrency: (caseData.notifiedCurrency as string) || 'CHF'
  };
};

// Convert our case to API audit format
export const caseToAudit = (caseData: Record<string, unknown>, quarter: string): ApiAuditResponse | null => {
  if (!caseData) return null;
  
  let formattedQuarter = quarter || "Q1-2023";
  // Ensure quarter is in the right format
  if (!isQuarterPeriod(formattedQuarter)) {
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / QUARTER_CALCULATIONS.MONTHS_PER_QUARTER) + QUARTER_CALCULATIONS.QUARTER_OFFSET as QuarterNumber;
    formattedQuarter = `Q${currentQuarter}-${currentDate.getFullYear()}`;
  }
  
  // Use the notificationDate from case data or create a realistic fallback
  const notificationDate = (caseData.notificationDate as string) || new Date().toISOString().split('T')[0];
  
  return {
    auditId: getNumericId(caseData.id as string),
    quarter: formattedQuarter as QuarterPeriod,
    caseObj: caseToCaseObj(caseData) || {
      caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
      claimOwner: {
        userId: 1,
        role: USER_ROLE_ENUM.TEAM_LEADER
      },
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      coverageAmount: 0,
      caseStatus: CASE_STATUS.COMPENSATED,
      notificationDate: notificationDate,
      notifiedCurrency: 'CHF'
    },
    auditor: {
      userId: 1,
      role: USER_ROLE_ENUM.SPECIALIST
    },
    isAkoReviewed: false
  };
};

// Generate findings for an audit
export const generateFindings = (auditId: string | number): ApiFindingResponse[] => {
  const numericId = getNumericId(auditId);
  const count = Math.floor(Math.random() * 3); // 0-2 findings per audit
  const findings: ApiFindingResponse[] = [];
  
  for (let i = 0; i < count; i++) {
    const findingTypes = Object.keys(FINDING_TYPES) as (keyof typeof FINDING_TYPES)[];
    const randomType = findingTypes[Math.floor(Math.random() * findingTypes.length)];
    
    findings.push({
      findingId: numericId * 10 + i + 1,
      type: randomType,
      description: `Sample finding ${i + 1} for audit ${numericId}: ${FINDING_TYPES[randomType]}`
    });
  }
  
  return findings;
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