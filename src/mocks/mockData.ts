import {createEmptyDetailedFindings, createEmptySpecialFindings, createUserId, User} from '../types';
import {CASE_TYPES} from '../constants';
import {CASE_TYPE_ENUM, CLAIMS_STATUS_ENUM, Department, DEFAULT_VALUE_ENUM, RATING_VALUE_ENUM, USER_ROLE_ENUM} from '../enums';
import {MockCaseData} from './mockTypes';
import { CURRENCY } from '../types/currencyTypes';
import { 
  createCaseId
} from '../types';
import { ValidCurrency } from '../types/currencyTypes';
import { 
  CLAIMS_STATUS, 
  CASE_STATUS_MAPPING
} from '../constants';

import { ApiCaseResponse } from './mockTypes';

// Mock users data
export const users: User[] = [
  { id: createUserId('1'), displayName: 'John Smith', department: Department.Claims, authorities: USER_ROLE_ENUM.SPECIALIST, enabled: true, initials: 'JS' },
  { id: createUserId('2'), displayName: 'Jane Doe', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'JD' },
  { id: createUserId('3'), displayName: 'Robert Johnson', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'RJ' },
  { id: createUserId('4'), displayName: 'Emily Davis', department: Department.Claims, authorities: USER_ROLE_ENUM.TEAM_LEADER, enabled: true, initials: 'ED' },
  { id: createUserId('5'), displayName: 'Michael Brown', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'MB' },
  { id: createUserId('6'), displayName: 'Sarah Wilson', department: Department.Claims, authorities: USER_ROLE_ENUM.SPECIALIST, enabled: true, initials: 'SW' },
  { id: createUserId('7'), displayName: 'David Thompson', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'DT' },
  { id: createUserId('8'), displayName: 'Lisa Garcia', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'LG' },
];

// Mock cases data
export const mockCases: MockCaseData[] = [
  {
    id: '1',
    userId: '1',
    notificationDate: '2025-04-20', // Q2 2025
    clientName: 'Thomas Anderson',
    policyNumber: 12345,
    caseNumber: 30045678,
    dossierRisk: 123456,
    dossierName: 'Matrix Incorporated',
    totalAmount: 525,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 525,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },
  {
    id: '2',
    userId: '2',
    notificationDate: '2025-04-25', // Q2 2025
    clientName: 'Alice Johnson',
    policyNumber: 67890,
    caseNumber: 30046789,
    dossierRisk: 234567,
    dossierName: 'Wonderland Holdings',
    totalAmount: 360,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 360,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
  },
  {
    id: '3',
    userId: '3',
    notificationDate: '2025-05-15', // Q2 2025
    clientName: 'Mark Wilson',
    policyNumber: 34567,
    caseNumber: 30047891,
    dossierRisk: 345678,
    dossierName: 'Wilson Family Trust',
    totalAmount: 440,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 440,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.USD
  },
  {
    id: '4',
    userId: '4',
    notificationDate: '2025-06-10', // Q2 2025
    clientName: 'Sarah Miller',
    policyNumber: 89012,
    caseNumber: 30048012,
    dossierRisk: 456789,
    dossierName: 'Miller Automotive Group',
    totalAmount: 875,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 875,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },
  {
    id: '5',
    userId: '5',
    notificationDate: '2025-01-15', // Q1 2025 (previous quarter)
    clientName: 'David Brown',
    policyNumber: 45678,
    caseNumber: 30049234,
    dossierRisk: 567890,
    dossierName: 'Brown Medical Associates',
    totalAmount: 970,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 970,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
  },
  {
    id: '6',
    userId: '6',
    notificationDate: '2025-02-10', // Q1 2025 (previous quarter)
    clientName: 'Jennifer Wilson',
    policyNumber: 78901,
    caseNumber: 30050345,
    dossierRisk: 678901,
    dossierName: 'Wilson Tech Solutions',
    totalAmount: 1250,
    isCompleted: false, // IN-PROGRESS CASE
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 1250,
    auditor: '4', // Being audited by Emily Davis (User ID 4, Team Leader)
    comment: 'Audit in progress - Jennifer Wilson case being reviewed by Emily Davis.',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.USD
  },
  {
    id: '7',
    userId: '7',
    notificationDate: '2025-03-20', // Q1 2025 (previous quarter)
    clientName: 'Michael Thompson',
    policyNumber: 23456,
    caseNumber: 30051456,
    dossierRisk: 789012,
    dossierName: 'Thompson Industries',
    totalAmount: 800,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 800,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },
  {
    id: '8',
    userId: '8',
    notificationDate: '2025-03-25', // Q1 2025 (previous quarter)
    clientName: 'Lisa Garcia',
    policyNumber: 56789,
    caseNumber: 30052567,
    dossierRisk: 890123,
    dossierName: 'Garcia Consulting',
    totalAmount: 650,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 650,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
  },
  {
    id: '11',
    userId: '5',
    notificationDate: '2025-05-22', // Q2 2025
    clientName: 'Michael Brown Jr.',
    policyNumber: 91234,
    caseNumber: 30053678,
    dossierRisk: 901234,
    dossierName: 'Brown Construction Ltd',
    totalAmount: 1100,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 1100,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },
  {
    id: '12',
    userId: '6',
    notificationDate: '2025-06-18', // Q2 2025
    clientName: 'Sarah Wilson',
    policyNumber: 12367,
    caseNumber: 30054789,
    dossierRisk: 123456,
    dossierName: 'Wilson Financial Services',
    totalAmount: 950,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 950,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.USD
  },
  // PRE-LOADED CASES: These will be shown in the table upon component loading
  {
    id: '13',
    userId: '1', 
    notificationDate: '2025-06-25', // Q2 2025
    clientName: 'Neo Anderson',
    policyNumber: 13579,
    caseNumber: 30055900,
    dossierRisk: 987654,
    dossierName: 'Zion Technologies',
    totalAmount: 1500,
    isCompleted: true, // VERIFIED CASE
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 1500,
    auditor: '4', // Verified by Emily Davis (User ID 4, Team Leader)
    comment: 'Audit completed successfully with excellent documentation and proper procedures followed.',
    rating: RATING_VALUE_ENUM.SUCCESSFULLY_FULFILLED,
    specialFindings: { 
      ...createEmptySpecialFindings(),
      feedback: true,
      communication: true
    },
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPE_ENUM.PRE_LOADED,
    notifiedCurrency: CURRENCY.CHF
  },
  {
    id: '14',
    userId: '4',
    notificationDate: '2025-06-20', // Q2 2025  
    clientName: 'Trinity Moss',
    policyNumber: 24680,
    caseNumber: 30056011,
    dossierRisk: 654321,
    dossierName: 'Nebuchadnezzar Corp',
    totalAmount: 775,
    isCompleted: false, // IN-PROGRESS CASE
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 775,
    auditor: '6', // In progress by Sarah Wilson (User ID 6, Specialist)
    comment: 'Audit in progress - Emily Davis case being reviewed by Sarah Wilson.',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPE_ENUM.PRE_LOADED,
    notifiedCurrency: CURRENCY.EUR
  },
  // Add a third preloaded case for Emily's in-progress work (for E2E test)
  {
    id: '15',
    userId: '3', // Robert Johnson's case
    notificationDate: '2025-06-15', // Q2 2025  
    clientName: 'Morpheus Johnson',
    policyNumber: 35791,
    caseNumber: 30057122,
    dossierRisk: 321987,
    dossierName: 'Red Pill Industries',
    totalAmount: 1200,
    isCompleted: false, // IN-PROGRESS by Emily for E2E test
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 1200,
    auditor: '4', // In progress by Emily Davis (User ID 4, Team Leader) - for E2E test
    comment: 'Emily is working on this audit - data persistence test case.',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPE_ENUM.PRE_LOADED,
    notifiedCurrency: CURRENCY.CHF
  }
];

// =======================================================
// CENTRALIZED MOCK DATA GENERATORS
// =======================================================

/**
 * Generate a random currency from available currencies
 */
const generateRandomCurrency = (): ValidCurrency => {
  const currencies = [CURRENCY.CHF, CURRENCY.EUR, CURRENCY.USD];
  return currencies[Math.floor(Math.random() * currencies.length)];
};

/**
 * Generate a realistic coverage amount based on user role
 */
const generateCoverageAmount = (userRole?: USER_ROLE_ENUM): number => {
  const maxAmount = userRole === USER_ROLE_ENUM.STAFF ? 30000 : 150000;
  return Math.floor(Math.random() * maxAmount) + 1000;
};

/**
 * Generate a notification date within a specific quarter
 */
const generateNotificationDateForQuarter = (quarterNum: number, year: number): string => {
  try {
    const startMonth = (quarterNum - 1) * 3; // 0-indexed month
    const randomDay = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid month-end issues
    const randomMonth = startMonth + Math.floor(Math.random() * 3); // Random month within quarter
    
    const notificationDate = new Date(year, randomMonth, randomDay);
    return notificationDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch (error) {
    console.warn('Error generating notification date:', error);
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Generate mock case for current quarter
 */
export const generateMockCurrentQuarterCase = (
  index: number, 
  quarterNum: number, 
  year: number, 
  users: User[]
): ApiCaseResponse => {
  const user = users[index % users.length];
  const notificationDate = generateNotificationDateForQuarter(quarterNum, year);
  const randomCurrency = generateRandomCurrency();
  
  return {
    caseNumber: createCaseId(40000000 + index),
    claimOwner: {
      userId: user.id,
      role: user.authorities
    },
    claimsStatus: index % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
    coverageAmount: generateCoverageAmount(user.authorities),
    caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
    notificationDate,
    notifiedCurrency: randomCurrency
  };
};

/**
 * Generate mock case for previous quarter
 */
export const generateMockPreviousQuarterCase = (
  index: number, 
  quarterNum: number, 
  year: number, 
  users: User[]
): ApiCaseResponse => {
  const user = users[index % users.length];
  const notificationDate = generateNotificationDateForQuarter(quarterNum, year);
  const randomCurrency = generateRandomCurrency();
  
  return {
    caseNumber: createCaseId(30000000 + index),
    claimOwner: {
      userId: user.id,
      role: user.authorities
    },
    claimsStatus: index % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
    coverageAmount: generateCoverageAmount(user.authorities),
    caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
    notificationDate,
    notifiedCurrency: randomCurrency
  };
};

/**
 * Generate mock cases for quarterly audit selection
 */
export const generateQuarterlyAuditSelectionCases = (
  quarterPeriod: string,
  users: User[],
  maxCases: number = 10
): Array<{
  caseNumber: number;
  claimOwner: {
    userId: string;
    displayName: string;
  };
  coverageAmount: number;
  claimsStatus: typeof CLAIMS_STATUS.FULL_COVER;
  notificationDate: string;
  notifiedCurrency: ValidCurrency;
}> => {
  try {
    // Parse the quarter key (e.g., "Q1-2023")
    const [quarterStr, yearStr] = quarterPeriod.split('-');
    const quarterNum = parseInt(quarterStr.replace('Q', ''));
    const year = parseInt(yearStr);
    
    return users
      .filter(user => user.enabled)
      .slice(0, maxCases)
      .map((user) => {
        const caseNumber = parseInt(generateRealisticCaseNumber());
        const notificationDate = generateNotificationDateForQuarter(quarterNum, year);
        const randomCurrency = generateRandomCurrency();
        
        return {
          caseNumber,
          claimOwner: {
            userId: user.id,
            displayName: user.displayName
          },
          coverageAmount: generateCoverageAmount(user.authorities),
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          notificationDate,
          notifiedCurrency: randomCurrency
        };
      });
  } catch (error) {
    console.error('Error generating quarterly audit selection cases:', error);
    return [];
  }
};

/**
 * Generate mock user quarterly audits
 */
export const generateUserQuarterlyAudits = (
  quarterKey: string,
  year: number,
  users: User[]
) => {
  return users
    .filter(user => user.enabled)
    .map(user => {
      const id = generateRealisticCaseNumber();
      return {
        id,
        auditId: id,
        dossierId: id,
        userId: user.id,
        coverageAmount: generateCoverageAmount(user.authorities),
        claimsStatus: CLAIMS_STATUS.FULL_COVER,
        quarter: quarterKey,
        year: year,
        caseType: 'USER_QUARTERLY'
      };
    });
};

/**
 * Generate mock previous quarter random audits
 */
export const generatePreviousQuarterRandomAudits = (
  prevQuarterNum: number,
  prevYear: number,
  users: User[],
  count: number = 2
) => {
  const activeUsers = users.filter(user => user.enabled && user.authorities !== USER_ROLE_ENUM.READER);
  
  return Array.from({ length: count }).map((_, index) => {
    const id = generateRealisticCaseNumber();
    const randomUser = activeUsers[index % activeUsers.length];
    
    return {
      id,
      dossierId: id,
      auditId: id,
      userId: randomUser.id,
      coverageAmount: Math.floor(Math.random() * 100000) + 1000,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      quarter: `Q${prevQuarterNum}-${prevYear}`,
      year: prevYear,
      caseType: 'PREVIOUS_QUARTER_RANDOM'
    };
  });
};

/**
 * Generate basic completion response data
 */
export const generateCompletionData = (auditId: number) => ({
  auditId,
  status: 'not_completed' as const,
  verifierId: 1,
  rating: '',
  comment: '',
  findings: []
});

/**
 * Generate audit completion response
 */
export const generateAuditCompletionResponse = (
  auditId: number,
  requestData: {
    auditor?: string;
    rating?: string;
    comment?: string;
    specialFindings?: Record<string, boolean>;
    detailedFindings?: Record<string, boolean>;
    status?: string;
    isCompleted?: boolean;
  }
) => ({
  success: true,
  auditId,
  auditor: requestData.auditor ?? '',
  rating: requestData.rating ?? '',
  comment: requestData.comment ?? '',
  specialFindings: requestData.specialFindings ?? {},
  detailedFindings: requestData.detailedFindings ?? {},
  status: requestData.status ?? 'completed',
  isCompleted: requestData.isCompleted ?? true,
  completionDate: generateCurrentTimestamp(),
  message: 'Audit completed successfully'
});

/**
 * Generate fallback audit object for error cases
 */
export const generateFallbackAudit = () => ({
  auditId: Math.floor(Math.random() * 10000) + 1,
  quarter: generateCurrentQuarterString(),
  caseObj: {
    caseNumber: Math.floor(40000000 + Math.random() * 1000000),
    claimOwner: {
      userId: 1,
      role: USER_ROLE_ENUM.TEAM_LEADER
    },
    claimsStatus: CLAIMS_STATUS.FULL_COVER,
    coverageAmount: 10000.00,
    caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
    notificationDate: generateCurrentDateString(),
    notifiedCurrency: CURRENCY.CHF
  },
  auditor: {
    userId: 2,
    role: USER_ROLE_ENUM.SPECIALIST
  }
});

/**
 * Generate fallback completion response
 */
export const generateFallbackCompletionResponse = (auditId: number, requestData: Record<string, unknown>) => ({
  auditId,
  status: requestData?.status ?? 'not_completed',
  verifierId: requestData?.verifierId ?? 1,
  rating: requestData?.rating ?? '',
  comment: requestData?.comment ?? '',
  completionDate: requestData?.status === 'completed' ? generateCurrentTimestamp() : undefined,
  findings: requestData?.findings ?? []
});

/**
 * Generate random audit ID
 */
export const generateRandomAuditId = (): number => {
  return Math.floor(Math.random() * 10000) + 1;
};

/**
 * Generate random finding ID
 */
export const generateRandomFindingId = (): number => {
  return Math.floor(Math.random() * 1000) + 1;
};

/**
 * Generate random case number for fallback scenarios
 */
export const generateRandomCaseNumber = (): number => {
  return Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE);
};

/**
 * Generate a realistic 8-digit case number starting with 4 (like 40001912)
 * Moved from statusUtils.ts for centralization
 */
export const generateRealisticCaseNumber = (): string => {
  const baseNumber = 40000000; // Start from 40000000
  const randomSuffix = Math.floor(Math.random() * 99999); // Add up to 99999
  return (baseNumber + randomSuffix).toString();
};

/**
 * Generate a random numeric ID for fallback cases
 * Moved from auxiliaryFunctions.ts for centralization
 */
export const generateFallbackNumericId = (id?: string | number): number => {
  if (!id) return Math.floor(Math.random() * 1000) + 1;
  const matches = RegExp(/\d+/).exec(id.toString());
  return matches ? parseInt(matches[0]) : Math.floor(Math.random() * 1000) + 1;
};

/**
 * Generate a realistic notification date within a quarter
 * Moved from QuarterlySelectionComponent.tsx for centralization
 */
export const generateNotificationDateForQuarterComponent = (quarterNum: number, year: number): string => {
  try {
    // Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
    const startMonth = Math.max(0, Math.min(11, (quarterNum - 1) * 3)); // 0-indexed month
    const randomDay = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid month-end issues
    const randomMonth = startMonth + Math.floor(Math.random() * 3); // Random month within quarter
    
    const calculatedDate = new Date(year, Math.min(11, randomMonth), Math.min(28, randomDay));
    return calculatedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch (error) {
    console.warn('Error calculating notification date, using fallback:', error);
    return generateCurrentDateString();
  }
};

/**
 * Generate findings for an audit
 * Moved from auxiliaryFunctions.ts for centralization
 */
export const generateAuditFindings = (numericId: number): Array<{
  findingId: string;
  type: string;
  description: string;
}> => {
  const numFindings = Math.floor(Math.random() * 3) + 1; // 1-3 findings
  const findingTypes = ['DOCUMENTATION_MISSING', 'AMOUNT_DISCREPANCY', 'PROCESS_VIOLATION'];
  
  return Array.from({ length: numFindings }, (_, i) => {
    const randomType = findingTypes[Math.floor(Math.random() * findingTypes.length)];
    
    return {
      findingId: `finding-${i + 1}`,
      type: randomType,
      description: `Sample finding ${i + 1} for audit ${numericId}: ${randomType}`
    };
  });
};

/**
 * Shuffle an array randomly (Fisher-Yates shuffle)
 * Moved from handlers.ts for centralization
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate current quarter string for mock APIs
 * Moved from handlers.ts for centralization
 */
export const generateCurrentQuarterString = (): string => {
  const now = new Date();
  const currentQuarter = Math.floor((now.getMonth()) / 3) + 1;
  return `Q${currentQuarter}-${now.getFullYear()}`;
};

/**
 * Generate current date string for mock APIs
 * Moved from handlers.ts for centralization
 */
export const generateCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Generate current timestamp for mock APIs
 * Moved from handlers.ts for centralization
 */
export const generateCurrentTimestamp = (): string => {
  return new Date().toISOString();
};