import { http, HttpResponse } from 'msw';
import { 
  User, 
  createUserId, 
  ClaimsStatus, 
  CaseStatus, 
  UserId, 
  CaseId, 
  QuarterPeriod,
  isQuarterPeriod,
  QuarterNumber,
  FindingType,
  createCaseId,
  CaseType,
  RatingValue,
  DetailedFindingsRecord,
  SpecialFindingsRecord,
  createEmptyDetailedFindings,
  createEmptySpecialFindings,
  ISODateString,
  UserRole
} from '../types';
import { 
  CLAIMS_STATUS, 
  CASE_STATUS, 
  CASE_TYPES, 
  FINDING_TYPES 
} from '../constants';
import { USER_ROLE_ENUM } from '../enums';
import { createCaseAuditId } from '../caseAuditTypes';
import { DEFAULT_VALUE_ENUM } from '../enums';
import { generateRealisticCaseNumber } from '../utils/caseIdGenerator';

// Mock data directly in the handlers file
export const users: User[] = [
  { id: createUserId('1'), name: 'John Smith', department: '5', role: USER_ROLE_ENUM.SPECIALIST, isActive: true, initials: 'JS' },
  { id: createUserId('2'), name: 'Jane Doe', department: '5', role: USER_ROLE_ENUM.STAFF, isActive: true, initials: 'JD' },
  { id: createUserId('3'), name: 'Robert Johnson', department: '5', role: USER_ROLE_ENUM.STAFF, isActive: true, initials: 'RJ' },
  { id: createUserId('4'), name: 'Emily Davis', department: '5', role: USER_ROLE_ENUM.TEAM_LEADER, isActive: true, initials: 'ED' },
  { id: createUserId('5'), name: 'Michael Brown', department: '5', role: USER_ROLE_ENUM.STAFF, isActive: true, initials: 'MB' },
  { id: createUserId('6'), name: 'Sarah Wilson', department: '5', role: USER_ROLE_ENUM.SPECIALIST, isActive: true, initials: 'SW' },
  { id: createUserId('7'), name: 'David Thompson', department: '5', role: USER_ROLE_ENUM.STAFF, isActive: true, initials: 'DT' },
  { id: createUserId('8'), name: 'Lisa Garcia', department: '5', role: USER_ROLE_ENUM.STAFF, isActive: true, initials: 'LG' },
];

// Define interface for our mock cases
interface MockCase extends Record<string, unknown> {
  id: string;
  userId: string;
  notificationDate: string;
  clientName: string;
  policyNumber: number;
  caseNumber: number;
  dossierRisk: number;
  dossierName: string;
  totalAmount: number;
  isVerified: boolean;
  claimsStatus: ClaimsStatus;
  coverageAmount: number;
  verifier: string;
  comment: string;
  rating: RatingValue;
  specialFindings: SpecialFindingsRecord;
  detailedFindings: DetailedFindingsRecord;
  quarter: string;
  year: number;
  isAkoReviewed: boolean;
  isSpecialist: boolean;
  caseType: CaseType;
}

const mockCases: MockCase[] = [
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
    isVerified: false,
    claimsStatus: CLAIMS_STATUS.FULL_COVER,
    coverageAmount: 525,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY
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
    isVerified: false,
    claimsStatus: CLAIMS_STATUS.FULL_COVER,
    coverageAmount: 360,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY
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
    isVerified: false,
    claimsStatus: CLAIMS_STATUS.PARTIAL_COVER,
    coverageAmount: 440,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY
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
    isVerified: false,
    claimsStatus: CLAIMS_STATUS.FULL_COVER,
    coverageAmount: 875,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY
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
    isVerified: false,
    claimsStatus: CLAIMS_STATUS.FULL_COVER,
    coverageAmount: 970,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY
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
    isVerified: false,
    claimsStatus: CLAIMS_STATUS.PARTIAL_COVER,
    coverageAmount: 1250,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY
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
    isVerified: false,
    claimsStatus: CLAIMS_STATUS.FULL_COVER,
    coverageAmount: 800,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY
  },
  {
    id: '8',
    userId: '8',
    notificationDate: '2024-10-05', // Q4 2024 (older quarter for variety)
    clientName: 'Lisa Garcia',
    policyNumber: 34567,
    caseNumber: 30052567,
    dossierRisk: 890123,
    dossierName: 'Garcia Consulting',
    totalAmount: 650,
    isVerified: false,
    claimsStatus: CLAIMS_STATUS.FULL_COVER,
    coverageAmount: 650,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '4',
    year: 2024,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY
  }
];

// Safely parse string to integer with fallback
const safeParseInt = (value: string | number | undefined, fallback = 0): number => {
  const parsed = parseInt(String(value));
  return isNaN(parsed) ? fallback : parsed;
};

// Safely extract numeric part from string ID
const getNumericId = (id: string | number | undefined): number => {
  if (!id) return Math.floor(Math.random() * 1000) + 1;
  const matches = id.toString().match(/\d+/);
  return matches ? parseInt(matches[0]) : Math.floor(Math.random() * 1000) + 1;
};

// Parse quarter string (Q1-2023) to get quarter number and year
const parseQuarter = (quarterStr: string): { quarterNum: number; year: number } | null => {
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

// Define interfaces for our mock data
interface CaseObj {
  caseNumber: CaseId;
  claimOwner: {
    userId: UserId | number;
    role: UserRole;
  };
  claimsStatus: ClaimsStatus;
  coverageAmount: number;
  caseStatus: CaseStatus;
  notificationDate: string;
}

interface AuditObj {
  auditId: number;
  quarter: QuarterPeriod;
  caseObj: CaseObj;
  auditor: {
    userId: UserId | number;
    role: UserRole;
  };
  isAkoReviewed: boolean;
}

// Define the FindingObj interface for consistent return types
interface FindingObj {
  findingId: number;
  type: FindingType | string;
  description: string;
}

// Utility function to deduce quarter from notification date
const getQuarterFromDate = (dateString: string): { quarterNum: number; year: number } => {
  const date = new Date(dateString);
  const month = date.getMonth(); // 0-indexed (0 = January, 11 = December)
  const year = date.getFullYear();
  const quarterNum = Math.floor(month / 3) + 1; // Convert to 1-indexed quarter (1-4)
  
  return { quarterNum, year };
};

// Utility to convert our case data to the API case format
const caseToCaseObj = (caseData: Record<string, unknown>): CaseObj | null => {
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
    notificationDate: notificationDate
  };
};

// Convert our case to API audit format
const caseToAudit = (caseData: Record<string, unknown>, quarter: string): AuditObj | null => {
  if (!caseData) return null;
  
  let formattedQuarter = quarter || "Q1-2023";
  // Ensure quarter is in the right format
  if (!isQuarterPeriod(formattedQuarter)) {
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1 as QuarterNumber;
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
      notificationDate: notificationDate
    },
    auditor: {
      userId: 1,
      role: USER_ROLE_ENUM.SPECIALIST
    },
    isAkoReviewed: false
  };
};

// Generate findings for an audit
const generateFindings = (auditId: string | number): FindingObj[] => {
  const numericId = getNumericId(auditId);
  const count = Math.floor(Math.random() * 3); // 0-2 findings per audit
  const findings: FindingObj[] = [];
  
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

// In-memory storage for created audits
const auditStore = new Map<number, AuditObj>();

// Calculate previous quarter info
const getPreviousQuarterInfo = (quarterNum: number, year: number) => {
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

// Update the interface definition
interface AuditRequestData {
  quarter?: string;
  caseObj?: {
    caseNumber?: string | number;
    claimOwner?: {
      userId?: string | number;
      role?: UserRole;
    };
    claimsStatus?: ClaimsStatus;
    coverageAmount?: number;
    caseStatus?: CaseStatus;
    [key: string]: unknown;
  };
  auditor?: {
    userId?: string | number;
    role?: UserRole;
    [key: string]: unknown;
  };
  type?: string;
  description?: string;
}

export const handlers = [
  // Get audits by quarter
  http.get('/api/audits/quarter/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      console.log(`[MSW] Handling request for quarter: ${quarter}`);
      
      const quarterValue = Array.isArray(quarter) ? quarter[0] : quarter ?? '';
      const parsedQuarter = parseQuarter(quarterValue);
      
      if (!parsedQuarter) {
        console.warn(`[MSW] Could not parse quarter string: ${quarter}`);
        return HttpResponse.json([], { status: 200 });
      }
      
      console.log(`[MSW] Parsed quarter: ${parsedQuarter.quarterNum}, year: ${parsedQuarter.year}`);
      
      // Filter cases for the requested quarter
      const filteredCases = mockCases.filter(caseItem => {
        try {
          const { quarterNum, year } = getQuarterFromDate(caseItem.notificationDate);
          
          return quarterNum === parsedQuarter.quarterNum && 
                year === parsedQuarter.year;
        } catch (e) {
          console.warn(`[MSW] Error filtering case ${caseItem.id}:`, e);
          return false;
        }
      });
      
      console.log(`[MSW] Filtered ${filteredCases.length} cases`);
      
      // Convert to API format
      const audits = filteredCases
        .map(caseItem => {
          try {
            return caseToAudit(caseItem, quarterValue);
          } catch (e) {
            console.warn(`[MSW] Error converting case ${caseItem.id} to audit:`, e);
            return null;
          }
        })
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this quarter
      let storeAudits = 0;
      for (const [, audit] of auditStore.entries()) {
        if (audit.quarter === quarter) {
          audits.push(audit);
          storeAudits++;
        }
      }
      
      console.log(`[MSW] Returning ${audits.length} audits (${storeAudits} from store)`);
      
      return HttpResponse.json(audits || [], { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/quarter/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Get audits by auditor
  http.get('/api/audits/auditor/:auditorId', ({ params }) => {
    try {
      const { auditorId } = params;
      const auditorIdValue = Array.isArray(auditorId) ? auditorId[0] : auditorId;
      const numericAuditorId = safeParseInt(auditorIdValue);
      console.log(`[MSW] Handling request for auditor: ${auditorId}`);
      
      // Filter cases to create mock audits for the given auditor
      // In this mock, we'll use modulo operation to assign audits to auditors
      const filteredCases = mockCases.filter(caseItem => 
        (getNumericId(caseItem.id) % 2) + 1 === numericAuditorId
      );
      
      // Convert to API format - use a recent quarter for these
      const currentQuarter = `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}`;
      const audits = filteredCases
        .map(caseItem => {
          try {
            return caseToAudit(caseItem, currentQuarter);
          } catch (e) {
            console.warn(`[MSW] Error converting case to audit:`, e);
            return null;
          }
        })
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this auditor
      for (const [, audit] of auditStore.entries()) {
        if (audit.auditor && audit.auditor.userId === numericAuditorId) {
          audits.push(audit);
        }
      }
      
      console.log(`[MSW] Returning ${audits.length} audits for auditor ${auditorId}`);
      
      return HttpResponse.json(audits, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/auditor/:auditorId handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Create Audit
  http.post('/api/audits', async ({ request }) => {
    try {
      let requestData: AuditRequestData = {};
      
      try {
        requestData = await request.json() as typeof requestData;
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body for /api/audits POST", error);
      }
      
      // Generate a new audit ID
      const auditId = Math.floor(Math.random() * 10000) + 1;
      
      // Create valid quarter format if needed
      let quarter = requestData.quarter;
      if (!quarter || !isQuarterPeriod(quarter)) {
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / 3) + 1 as QuarterNumber;
        quarter = `Q${currentQuarter}-${now.getFullYear()}` as QuarterPeriod;
      }
      
      // Create a new audit object
      const newAudit: AuditObj = {
        auditId,
        quarter: quarter as QuarterPeriod,
        caseObj: {
          caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
          claimOwner: {
            userId: typeof requestData.caseObj === 'object' && requestData.caseObj?.claimOwner?.userId !== undefined 
              ? safeParseInt(String(requestData.caseObj.claimOwner.userId)) 
              : 1,
            role: typeof requestData.caseObj === 'object' && requestData.caseObj?.claimOwner?.role !== undefined
              ? requestData.caseObj.claimOwner.role
              : USER_ROLE_ENUM.TEAM_LEADER
          },
          claimsStatus: (requestData.caseObj?.claimsStatus as ClaimsStatus) || CLAIMS_STATUS.FULL_COVER,
          coverageAmount: requestData.caseObj?.coverageAmount || 10000.00,
          caseStatus: (requestData.caseObj?.caseStatus as CaseStatus) || CASE_STATUS.COMPENSATED,
          notificationDate: new Date().toISOString().split('T')[0]
        },
        auditor: {
          userId: requestData.auditor?.userId !== undefined 
            ? safeParseInt(requestData.auditor.userId as string | number) 
            : 2,
          role: requestData.auditor?.role || USER_ROLE_ENUM.SPECIALIST
        },
        isAkoReviewed: false
      };
      
      // Store the audit
      auditStore.set(auditId, newAudit);
      
      console.log(`[MSW] Created new audit with ID ${auditId}`);
      
      return HttpResponse.json(newAudit, { status: 201 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits POST handler:", error);
      
      // Return a fallback audit object
      const fallbackAudit = {
        auditId: Math.floor(Math.random() * 10000) + 1,
        quarter: `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}`,
        caseObj: {
          caseNumber: Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE),
          claimOwner: {
            userId: 1,
            role: USER_ROLE_ENUM.TEAM_LEADER
          },
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          coverageAmount: 10000.00,
          caseStatus: CASE_STATUS.COMPENSATED,
          notificationDate: new Date().toISOString().split('T')[0]
        },
        auditor: {
          userId: 2,
          role: USER_ROLE_ENUM.SPECIALIST
        },
        isAkoReviewed: false
      };
      
      return HttpResponse.json(fallbackAudit, { status: 201 });
    }
  }),

  // Update Audit
  http.put('/api/audits/:auditId', async ({ params, request }) => {
    try {
      const { auditId } = params;
      const auditIdValue = Array.isArray(auditId) ? auditId[0] : auditId;
      const numericAuditorId = safeParseInt(auditIdValue);
      
      let requestData: AuditRequestData = {
        type: "DOCUMENTATION_ISSUE",
        description: "No description provided"
      };
      
      try {
        const jsonData = await request.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = {
            type: jsonData.type || requestData.type,
            description: jsonData.description || requestData.description,
            quarter: jsonData.quarter || requestData.quarter,
            caseObj: jsonData.caseObj || requestData.caseObj,
            auditor: jsonData.auditor || requestData.auditor
          };
        }
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body, using default data", error);
      }
      
      // Fix requestData.quarter if needed
      if (requestData.quarter && !isQuarterPeriod(requestData.quarter)) {
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / 3) + 1 as QuarterNumber;
        requestData.quarter = `Q${currentQuarter}-${now.getFullYear()}` as QuarterPeriod;
      }
      
      // Get existing audit or create a placeholder
      let existingAudit = auditStore.get(numericAuditorId);
      
      if (!existingAudit) {
        // If not in our store, create a new one with this ID
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / 3) + 1 as QuarterNumber;
        const quarterStr = `Q${currentQuarter}-${now.getFullYear()}` as QuarterPeriod;
        
        existingAudit = {
          auditId: numericAuditorId,
          quarter: requestData.quarter as QuarterPeriod || quarterStr,
          caseObj: {
            caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
            claimOwner: {
              userId: 1,
              role: USER_ROLE_ENUM.TEAM_LEADER
            },
            claimsStatus: CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
            coverageAmount: 10000.00,
            caseStatus: CASE_STATUS.COMPENSATED as CaseStatus,
            notificationDate: new Date().toISOString().split('T')[0]
          },
          auditor: {
            userId: 2,
            role: USER_ROLE_ENUM.SPECIALIST
          },
          isAkoReviewed: false
        };
      }
      
      // Update audit with new data
      const updatedAudit = {
        ...existingAudit!,
        ...(requestData.quarter && { quarter: requestData.quarter as QuarterPeriod }),
        ...(requestData.caseObj && { caseObj: {
          ...existingAudit!.caseObj,
          // Safely handle caseObj properties
          ...(typeof requestData.caseObj === 'object' ? 
            // Only include properties that can be safely typed
            {
              ...(requestData.caseObj.caseNumber !== undefined && { 
                caseNumber: createCaseId(safeParseInt(requestData.caseObj.caseNumber as string | number))
              }),
              ...(requestData.caseObj.claimOwner && {
                claimOwner: {
                  ...existingAudit!.caseObj.claimOwner,
                  ...(requestData.caseObj.claimOwner.userId !== undefined && {
                    userId: safeParseInt(String(requestData.caseObj.claimOwner.userId))
                  }),
                  ...(requestData.caseObj.claimOwner.role && {
                    role: requestData.caseObj.claimOwner.role
                  })
                }
              }),
              ...(requestData.caseObj.claimsStatus && {
                claimsStatus: requestData.caseObj.claimsStatus as ClaimsStatus
              }),
              ...(requestData.caseObj.coverageAmount !== undefined && {
                coverageAmount: safeParseInt(requestData.caseObj.coverageAmount as string | number, existingAudit!.caseObj.coverageAmount)
              }),
              ...(requestData.caseObj.caseStatus && {
                caseStatus: requestData.caseObj.caseStatus as CaseStatus
              })
            } : {})
        }}),
        ...(requestData.auditor && { auditor: {
          ...existingAudit!.auditor,
          // Safely handle auditor properties
          ...(requestData.auditor.userId !== undefined && {
            userId: safeParseInt(String(requestData.auditor.userId))
          }),
          ...(requestData.auditor.role && {
            role: requestData.auditor.role
          })
        }})
      };
      
      // Store the updated audit
      auditStore.set(numericAuditorId, updatedAudit);
      
      console.log(`[MSW] Updated audit with ID ${numericAuditorId}`);
      
      return HttpResponse.json(updatedAudit, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/:auditId PUT handler:", error);
      
      // Return a fallback updated audit
      const fallbackAudit: AuditObj = {
        auditId: safeParseInt(Array.isArray(params.auditId) ? params.auditId[0] : params.auditId, 1),
        quarter: `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}` as QuarterPeriod,
        caseObj: {
          caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
          claimOwner: {
            userId: 1,
            role: USER_ROLE_ENUM.TEAM_LEADER
          },
          claimsStatus: CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
          coverageAmount: 10000.00,
          caseStatus: CASE_STATUS.COMPENSATED as CaseStatus,
          notificationDate: new Date().toISOString().split('T')[0]
        },
        auditor: {
          userId: 2,
          role: USER_ROLE_ENUM.SPECIALIST
        },
        isAkoReviewed: false
      };
      
      return HttpResponse.json(fallbackAudit, { status: 200 });
    }
  }),

  // Get findings for an audit
  http.get('/api/audits/:auditId/findings', ({ params }) => {
    try {
      const { auditId } = params;
      console.log(`[MSW] Getting findings for audit ${auditId}`);
      
      // Generate mock findings for this audit
      const auditIdValue = Array.isArray(auditId) ? auditId[0] : auditId;
      const findings = generateFindings(auditIdValue ?? 1);
      
      return HttpResponse.json(findings, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/:auditId/findings GET handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Add finding to audit
  http.post('/api/audits/:auditId/findings', async ({ params, request }) => {
    try {
      const { auditId } = params;
      
      let requestData: { type: string; description: string; } = {
        type: "DOCUMENTATION_ISSUE",
        description: "No description provided"
      };
      
      try {
        const jsonData = await request.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = {
            type: jsonData.type || requestData.type,
            description: jsonData.description || requestData.description
          };
        }
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body, using default data", error);
      }
      
      // Create a new finding with an ID
      const newFinding = {
        findingId: Math.floor(Math.random() * 1000) + 1,
        type: requestData.type || "DOCUMENTATION_ISSUE",
        description: requestData.description || "No description provided"
      };
      
      console.log(`[MSW] Added finding to audit ${auditId}:`, newFinding);
      
      return HttpResponse.json(newFinding, { status: 201 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/:auditId/findings POST handler:", error);
      return HttpResponse.json({
        findingId: Math.floor(Math.random() * 1000) + 1,
        type: "DOCUMENTATION_ISSUE",
        description: "Error creating finding"
      }, { status: 201 });
    }
  }),

  // Select cases for audit
  http.get('/api/audits/select-cases/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      console.log(`[MSW] Selecting cases for quarter ${quarter}`);
      
      const quarterValue = Array.isArray(quarter) ? quarter[0] : quarter ?? '';
      const parsedQuarter = parseQuarter(quarterValue);
      
      if (!parsedQuarter) {
        console.warn(`[MSW] Could not parse quarter string: ${quarter}`);
        return HttpResponse.json([], { status: 200 });
      }
      
      // Get 8 cases for the current quarter - using notificationDate to deduce quarter
      const currentQuarterCases = mockCases
        .filter(caseItem => {
          try {
            // Use the notificationDate property to deduce quarter
            const notificationDate = caseItem.notificationDate;
            const { quarterNum, year } = getQuarterFromDate(notificationDate);
            
            const isMatch = quarterNum === parsedQuarter.quarterNum && year === parsedQuarter.year;
            if (isMatch) {
              console.log(`[MSW] Found current quarter case: ${caseItem.id} with notificationDate ${notificationDate} (Q${quarterNum}-${year})`);
            }
            return isMatch;
          } catch (e) {
            console.warn(`[MSW] Error filtering case ${caseItem.id}:`, e);
            return false;
          }
        })
        .slice(0, 8) // Take 8 cases for current quarter
        .map(caseItem => caseToCaseObj(caseItem))
        .filter(caseObj => caseObj !== null);
      
      // Get 2 random cases from previous quarter - using notificationDate to deduce quarter
      const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(parsedQuarter.quarterNum, parsedQuarter.year);
      console.log(`[MSW] Looking for previous quarter cases: Q${prevQuarterNum}-${prevYear}`);
      
      const previousQuarterCases = mockCases
        .filter(caseItem => {
          try {
            // Use the notificationDate property to deduce quarter
            const notificationDate = caseItem.notificationDate;
            const { quarterNum, year } = getQuarterFromDate(notificationDate);
            
            const isMatch = quarterNum === prevQuarterNum && year === prevYear;
            if (isMatch) {
              console.log(`[MSW] Found previous quarter case: ${caseItem.id} with notificationDate ${notificationDate} (Q${quarterNum}-${year})`);
            }
            return isMatch;
          } catch (e) {
            return false;
          }
        })
        .slice(0, 2) // Take 2 random cases from previous quarter
        .map(caseItem => caseToCaseObj(caseItem))
        .filter(caseObj => caseObj !== null);
      
      // If we don't have enough cases, generate some mock ones
      const totalCurrentCases = currentQuarterCases.length;
      const totalPreviousCases = previousQuarterCases.length;
      
      console.log(`[MSW] Found ${totalCurrentCases} current quarter cases, need 8`);
      console.log(`[MSW] Found ${totalPreviousCases} previous quarter cases, need 2`);
      
      // Generate additional current quarter cases if needed
      for (let i = totalCurrentCases; i < 8; i++) {
        // Generate a notification date for the current quarter
        const currentQuarterDate = new Date(parsedQuarter.year, (parsedQuarter.quarterNum - 1) * 3 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
        
        const mockCase: CaseObj = {
          caseNumber: createCaseId(40000000 + i),
          claimOwner: {
            userId: users[i % users.length].id,
            role: users[i % users.length].role
          },
          claimsStatus: i % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
          coverageAmount: Math.floor(Math.random() * 100000) + 1000,
          caseStatus: CASE_STATUS.COMPENSATED,
          notificationDate: currentQuarterDate.toISOString().split('T')[0]
        };
        console.log(`[MSW] Generated additional current quarter case with notificationDate: ${mockCase.notificationDate}`);
        currentQuarterCases.push(mockCase);
      }
      
      // Generate additional previous quarter cases if needed
      for (let i = totalPreviousCases; i < 2; i++) {
        // Generate a notification date for the previous quarter
        const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(parsedQuarter.quarterNum, parsedQuarter.year);
        const previousQuarterDate = new Date(prevYear, (prevQuarterNum - 1) * 3 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
        
        const mockCase: CaseObj = {
          caseNumber: createCaseId(30000000 + i),
          claimOwner: {
            userId: users[i % users.length].id,
            role: users[i % users.length].role
          },
          claimsStatus: i % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
          coverageAmount: Math.floor(Math.random() * 100000) + 1000,
          caseStatus: CASE_STATUS.COMPENSATED,
          notificationDate: previousQuarterDate.toISOString().split('T')[0]
        };
        console.log(`[MSW] Generated additional previous quarter case with notificationDate: ${mockCase.notificationDate}`);
        previousQuarterCases.push(mockCase);
      }
      
      // Combine all cases (8 current + 2 previous = 10 total)
      const allCases = [...currentQuarterCases, ...previousQuarterCases];
      
      console.log(`[MSW] Returning ${allCases.length} cases (${currentQuarterCases.length} current quarter + ${previousQuarterCases.length} previous quarter)`);
      console.log(`[MSW] Cases now include notificationDate for quarter deduction`);
      
      // Log the notification dates of all returned cases for verification
      allCases.forEach((caseObj, index) => {
        const { quarterNum, year } = getQuarterFromDate(caseObj.notificationDate);
        console.log(`[MSW] Case ${index + 1}: notificationDate ${caseObj.notificationDate} → Q${quarterNum}-${year}`);
      });
      
      return HttpResponse.json(allCases, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/select-cases/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Get all users
  http.get('/api/users', () => {
    return HttpResponse.json({ 
      success: true, 
      data: users
    });
  }),
  
  http.get('/api/users/:id', ({ params }) => {
    const user = users.find(u => u.id === createUserId(params.id as string));
    
    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ 
      success: true, 
      data: user
    });
  }),
  
  // Verification handlers
  
  // Handler for getting audits by user/auditor
  http.get('/api/audits/auditor/:userId', ({ params }) => {
    const { userId } = params;
    const userIdValue = userId ? userId.toString() : '';
    
    // Generate audit objects for this user
    const auditCount = getNumericId(userIdValue) % 5 + 1; // 1-5 audits based on ID
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    
    const audits = Array.from({ length: auditCount }, (_, i) => {
      const caseNumber = createCaseId(30040000 + getNumericId(userIdValue) * 100 + i);
      const caseObj = {
        caseNumber,
        claimOwner: {
          userId: createUserId(userIdValue),
          role: Math.random() > 0.7 ? USER_ROLE_ENUM.SPECIALIST : USER_ROLE_ENUM.STAFF
        },
        coverageAmount: Math.floor(Math.random() * 100000) + 500,
        claimsStatus: Math.random() > 0.7 ? CLAIMS_STATUS.PARTIAL_COVER : CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
        caseStatus: CASE_STATUS.COMPENSATED as CaseStatus
      };
      
      return {
        auditId: (getNumericId(userIdValue) * 1000 + i + 1),
        quarter: `Q${currentQuarter}-${year}` as QuarterPeriod,
        caseObj,
        auditor: {
          userId: createUserId(userIdValue),
          role: Math.random() > 0.7 ? USER_ROLE_ENUM.SPECIALIST : USER_ROLE_ENUM.STAFF
        },
        isAkoReviewed: Math.random() > 0.8 // 20% chance of being reviewed
      };
    });
    
    return HttpResponse.json({ 
      success: true, 
      data: audits
    });
  }),
  
  // Get random audit for user
  http.get('/api/audits/random/:userId', ({ params, request }) => {
    try {
      const { userId } = params;
    const url = new URL(request.url);
      const quarter = url.searchParams.get('quarter');
      const year = url.searchParams.get('year');
      
      console.log(`[MSW] Getting random audit for user ${userId}, quarter ${quarter}, year ${year}`);
      
      // Parse the user ID
      const userIdValue = Array.isArray(userId) ? userId[0] : userId;
      const numericUserId = safeParseInt(userIdValue);
      
      // Parse the quarter (e.g., "Q1-2023")
      let quarterPeriod: QuarterPeriod;
      if (!quarter || !isQuarterPeriod(quarter)) {
        const currentYear = year ? parseInt(year) : new Date().getFullYear();
        const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1 as QuarterNumber;
        quarterPeriod = `Q${currentQuarter}-${currentYear}` as QuarterPeriod;
      } else {
        quarterPeriod = quarter as QuarterPeriod;
      }
      
      // Try to find a suitable audit for this user
      const filteredAudits = mockCases
        .filter(caseItem => {
          // Some logic to determine if this case should be assigned to this user
          return getNumericId(caseItem.id) % 5 === numericUserId % 5;
        })
        .slice(0, 3); // Limit to 3 possible audits
      
      if (filteredAudits.length > 0) {
        // Pick one randomly
        const randomIndex = Math.floor(Math.random() * filteredAudits.length);
        const randomCase = filteredAudits[randomIndex];
        const auditRecord = caseToAudit(randomCase, quarterPeriod);
        
        // Add dossierRisk to the audit record
        const auditWithRisk = {
          ...auditRecord,
          dossierRisk: Math.floor(Math.random() * 10) + 1
        };
        
        console.log(`[MSW] Found random audit for user ${userId}`);
        return HttpResponse.json({
          success: true,
          data: auditWithRisk
        }, { status: 200 });
      }
      
      // If no audit found, create a fallback audit
      console.log(`[MSW] Creating fallback audit for user ${userId}`);
      const fallbackAudit = {
        auditId: createCaseAuditId((Math.floor(Math.random() * 10000) + 1).toString()),
        quarter: quarterPeriod,
        caseObj: {
          caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
          claimOwner: {
            userId: numericUserId,
            role: USER_ROLE_ENUM.SPECIALIST
          },
          coverageAmount: 0,
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          caseStatus: CASE_STATUS.COMPENSATED
        },
        isAkoReviewed: false,
        auditor: {
          userId: numericUserId,
          role: USER_ROLE_ENUM.SPECIALIST
        },
        dossierRisk: Math.floor(Math.random() * 10) + 1
      };
      
      return HttpResponse.json({
        success: true,
        data: fallbackAudit
      }, { status: 200 });
      
    } catch (error) {
      console.error("[MSW] Error in /api/audits/random/:userId handler:", error);
      
      // Return error response
      return HttpResponse.json({
        success: false,
        error: "Failed to get random audit"
      }, { status: 500 });
    }
  }),
  
  // Handler for selecting quarterly dossiers
  http.post('/api/verification/select-quarterly', async ({ request }) => {
    try {
      const body = await request.json() as { quarterKey: string; userIds: string[] };
      const { quarterKey } = body;
      
      // Parse the quarter key (e.g., "Q1-2023")
      const [quarterStr, yearStr] = quarterKey.split('-');
      const quarterNum = parseInt(quarterStr.replace('Q', ''));
      const year = parseInt(yearStr);
      
      // Calculate previous quarter (use the function)
      const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(quarterNum, year);
      
      // Use these values
      console.log(`[MSW] Previous quarter: Q${prevQuarterNum}-${prevYear}`);
      
      // Generate mock user audits (would be one per eligible user)
      const userQuarterlyAudits = users
        .filter(user => user.isActive)
        .map(user => {
          const caseNumber = generateRealisticCaseNumber();
          const id = caseNumber; // Remove QUARTERLY prefix
          return {
            id,
            auditId: id,
            dossierId: id,
            userId: user.id,
            coverageAmount: Math.floor(
              Math.random() * (user.role === USER_ROLE_ENUM.STAFF ? 30000 : 150000)
            ),
            claimsStatus: CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
            isAkoReviewed: false,
            quarter: quarterKey, // Add current quarter
            year: year, // Add current year
            caseType: 'USER_QUARTERLY' // Add case type
          };
        });
      
      // Generate mock previous quarter audits for quality control
      const previousQuarterRandomAudits = Array.from({ length: 2 }).map((_, index) => {
        const caseNumber = generateRealisticCaseNumber();
        const id = caseNumber; // Remove PREV-QUARTER prefix
        // Assign to a random active user
        const activeUsers = users.filter(user => user.isActive && user.role !== USER_ROLE_ENUM.READER);
        const randomUser = activeUsers[index % activeUsers.length];
        
        return {
          id,
          dossierId: id,
          auditId: id,
          userId: randomUser.id, // Assign to actual user
          coverageAmount: Math.floor(Math.random() * 100000),
          claimsStatus: CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
          isAkoReviewed: false,
          quarter: `Q${prevQuarterNum}-${prevYear}`, // Add previous quarter
          year: prevYear, // Add previous quarter year
          caseType: 'PREVIOUS_QUARTER_RANDOM' // Add case type
        };
      });
      
      return HttpResponse.json({
        success: true,
        data: {
          quarterKey,
          userQuarterlyAudits,
          previousQuarterRandomAudits,
          lastSelectionDate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in quarterly dossier selection handler:', error);
      return HttpResponse.json(
        { success: false, error: 'Failed to select quarterly dossiers' },
        { status: 500 }
      );
    }
  }),

  // Get current logged-in user
  http.get('/api/auth/current-user', () => {
    // In production, this would return information about the currently logged-in user
    // For our mock, we pretend the logged-in user is the team leader with id '4'
    const currentUser = users.find(u => u.id === createUserId('4'));
    
    if (currentUser) {
      return HttpResponse.json({ 
        success: true, 
        data: currentUser
      });
    }
    
    return HttpResponse.json(
      { success: false, error: 'No current user found' },
      { status: 404 }
    );
  }),

  // Add new verification endpoints
  
  // Get audit verification data
  http.get('/api/audit-verification/:auditId', async ({ params }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      // For now, return a basic verification response
      // In a real implementation, this would fetch from the database
      const verificationData = {
        auditId: numericAuditId,
        status: 'not_verified' as const,
        verifierId: 1,
        rating: '',
        comment: '',
        findings: []
      };
      
      return HttpResponse.json({
        success: true,
        data: verificationData
      }, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audit-verification/:auditId GET handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to fetch verification data'
      }, { status: 500 });
    }
  }),
  
  // Update audit verification data
  http.put('/api/audit-verification/:auditId', async ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      // Parse request body
      let requestData: {
        status?: string;
        verifierId?: number;
        rating?: string;
        comment?: string;
        findings?: Array<{
          type: string;
          description: string;
          category: string;
        }>;
      } = {};
      try {
        const jsonData = await request.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData as typeof requestData;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for verification update");
      }
      
      console.log(`[MSW] Updating verification data for audit ${numericAuditId}:`, requestData);
      
      // In a real implementation, this would save to the database
      // For now, just return a success response with the data
      const verificationResponse = {
        auditId: numericAuditId,
        status: requestData.status || 'not_verified',
        verifierId: requestData.verifierId || 1,
        rating: requestData.rating || '',
        comment: requestData.comment || '',
        verificationDate: requestData.status === 'verified' ? new Date().toISOString() : undefined,
        findings: requestData.findings || []
      };
      
      return HttpResponse.json({
        success: true,
        data: verificationResponse
      }, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audit-verification/:auditId PUT handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to update verification data'
      }, { status: 500 });
    }
  }),
]; 